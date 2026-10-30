import {
  BenchmarkConfig,
  DnsProvider,
  DnsRcode,
  DnsRecordType,
  ProviderBenchmarkSummary,
  QueryMeasurement,
  BenchmarkSession,
} from '../types/dns';
import { buildDnsQuery, parseDnsResponse } from './dns-wire';
import { createPrng, shuffleArray } from './prng';
import { getDomainForRound } from './datasets';
import { computeProviderSummary } from './stats';

export interface BenchmarkProgress {
  totalQueriesPlanned: number;
  completedQueries: number;
  failedQueries: number;
  currentRound: number;
  totalRounds: number;
  currentProviderId?: string;
  currentProviderName?: string;
  currentDomain?: string;
  elapsedMs: number;
  isComplete: boolean;
  isCancelled: boolean;
}

export type BenchmarkEventCallback = (progress: BenchmarkProgress) => void;
export type MeasurementCallback = (providerId: string, measurement: QueryMeasurement) => void;

export class DnsBenchmarkEngine {
  private abortController: AbortController | null = null;
  private isRunning: boolean = false;

  public async runBenchmark(
    providers: DnsProvider[],
    config: BenchmarkConfig,
    onProgress?: BenchmarkEventCallback,
    onMeasurement?: MeasurementCallback
  ): Promise<BenchmarkSession> {
    if (this.isRunning) {
      throw new Error('Benchmark engine is already running a session.');
    }

    if (providers.length === 0) {
      throw new Error('No DNS providers selected for benchmarking.');
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const sessionId = `bench-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const randomSeed = Math.floor(Math.random() * 2147483647);
    const prng = createPrng(randomSeed);

    const totalRounds = config.queriesPerProvider;
    const totalQueriesPlanned = totalRounds * providers.length;
    let completedQueries = 0;
    let failedQueries = 0;
    const startTime = performance.now();

    // Mapping providerId -> QueryMeasurement[]
    const providerMeasurements = new Map<string, QueryMeasurement[]>();
    for (const p of providers) {
      providerMeasurements.set(p.id, []);
    }

    const reportProgress = (
      isComplete: boolean = false,
      isCancelled: boolean = false,
      currentProvider?: DnsProvider,
      currentDomain?: string,
      currentRound: number = 0
    ) => {
      if (onProgress) {
        onProgress({
          totalQueriesPlanned,
          completedQueries,
          failedQueries,
          currentRound,
          totalRounds,
          currentProviderId: currentProvider?.id,
          currentProviderName: currentProvider?.name,
          currentDomain,
          elapsedMs: Math.round(performance.now() - startTime),
          isComplete,
          isCancelled,
        });
      }
    };

    reportProgress(false, false, undefined, undefined, 0);

    try {
      // Paired testing rounds
      for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
        if (signal.aborted) {
          break;
        }

        const domain = getDomainForRound(config.profile, roundIndex, config.customDomains);

        // Randomize provider execution order within this round to eliminate systematic ordering bias
        const roundProviders = shuffleArray(providers, prng);

        for (const provider of roundProviders) {
          if (signal.aborted) {
            break;
          }

          reportProgress(false, false, provider, domain, roundIndex + 1);

          const existingMeasurements = providerMeasurements.get(provider.id) || [];
          const isFirstObserved = existingMeasurements.length === 0;

          // Select primary DoH endpoint
          const dohEndpoint = provider.endpoints.doh[0]?.url;

          if (!dohEndpoint) {
            // Provider does not have a configured DoH endpoint
            const missingMeasurement: QueryMeasurement = {
              queryIndex: existingMeasurements.length,
              domain,
              recordType: config.recordType,
              roundIndex,
              isFirstObserved,
              startTime: performance.now(),
              latencyMs: 0,
              success: false,
              errorType: 'network',
              errorMessage: 'Provider does not offer a public DoH endpoint',
            };
            existingMeasurements.push(missingMeasurement);
            providerMeasurements.set(provider.id, existingMeasurements);
            failedQueries++;
            completedQueries++;
            if (onMeasurement) onMeasurement(provider.id, missingMeasurement);
            continue;
          }

          // Execute query
          const measurement = await this.executeQuery(
            dohEndpoint,
            domain,
            config.recordType,
            existingMeasurements.length,
            roundIndex,
            isFirstObserved,
            config.timeoutMs,
            signal
          );

          existingMeasurements.push(measurement);
          providerMeasurements.set(provider.id, existingMeasurements);

          completedQueries++;
          if (!measurement.success) {
            failedQueries++;
          }

          if (onMeasurement) {
            onMeasurement(provider.id, measurement);
          }

          reportProgress(false, false, provider, domain, roundIndex + 1);
        }
      }
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }

    const wasCancelled = signal.aborted;
    reportProgress(true, wasCancelled);

    // Compute summaries
    const providerSummaries: ProviderBenchmarkSummary[] = providers.map((p) => {
      const measurements = providerMeasurements.get(p.id) || [];
      const endpoint = p.endpoints.doh[0]?.url || 'unknown';
      return computeProviderSummary(p.id, p.name, endpoint, measurements);
    });

    return {
      id: sessionId,
      timestamp: new Date().toISOString(),
      config,
      randomSeed,
      providerSummaries,
      notes: wasCancelled ? 'Benchmark stopped prematurely by user request.' : undefined,
    };
  }

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  public get active(): boolean {
    return this.isRunning;
  }

  /**
   * Executes a single DoH query with strict high-resolution performance.now() timing
   */
  public async executeQuery(
    endpointUrl: string,
    domain: string,
    recordType: DnsRecordType,
    queryIndex: number,
    roundIndex: number,
    isFirstObserved: boolean,
    timeoutMs: number,
    parentSignal?: AbortSignal
  ): Promise<QueryMeasurement> {
    const queryPacket = buildDnsQuery(domain, recordType);
    const timeoutController = new AbortController();
    let isTimeout = false;

    const timeoutTimer = setTimeout(() => {
      isTimeout = true;
      timeoutController.abort();
    }, timeoutMs);

    const onParentAbort = () => {
      timeoutController.abort();
    };

    if (parentSignal) {
      parentSignal.addEventListener('abort', onParentAbort);
    }

    const queryStartTime = performance.now();

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/dns-message',
          'Accept': 'application/dns-message',
        },
        body: queryPacket as unknown as BodyInit,
        signal: timeoutController.signal,
        cache: 'no-store',
      });

      const httpStatus = response.status;
      if (!response.ok) {
        const latencyMs = Number((performance.now() - queryStartTime).toFixed(2));
        return {
          queryIndex,
          domain,
          recordType,
          roundIndex,
          isFirstObserved,
          startTime: queryStartTime,
          httpStatus,
          latencyMs,
          success: false,
          errorType: 'http_error',
          errorMessage: `HTTP ${httpStatus} ${response.statusText || 'Error'}`,
        };
      }

      const responseBuffer = await response.arrayBuffer();
      const latencyMs = Number((performance.now() - queryStartTime).toFixed(2));

      // Parse RFC 1035 wire message
      let parsed;
      try {
        parsed = parseDnsResponse(responseBuffer);
      } catch (parseErr) {
        return {
          queryIndex,
          domain,
          recordType,
          roundIndex,
          isFirstObserved,
          startTime: queryStartTime,
          httpStatus,
          latencyMs,
          success: false,
          errorType: 'dns_parse_error',
          errorMessage: parseErr instanceof Error ? parseErr.message : 'Invalid DNS wire format',
        };
      }

      const rcodeName: DnsRcode = parsed.rcodeName;
      // Handle DNS response codes:
      // NOERROR and NXDOMAIN are legitimate DNS answers from the recursive resolver.
      // SERVFAIL and REFUSED indicate upstream resolver failure.
      const isDnsSuccess = rcodeName === 'NOERROR' || rcodeName === 'NXDOMAIN';

      return {
        queryIndex,
        domain,
        recordType,
        roundIndex,
        isFirstObserved,
        startTime: queryStartTime,
        httpStatus,
        dnsRcode: rcodeName,
        answersCount: parsed.answers.length,
        answers: parsed.answers.map((a) => `${a.type} ${a.data}`),
        latencyMs,
        success: isDnsSuccess,
        errorType: isDnsSuccess ? undefined : 'dns_rcode_error',
        errorMessage: isDnsSuccess ? undefined : `Resolver returned DNS RCODE: ${rcodeName}`,
      };
    } catch (err: unknown) {
      const latencyMs = Number((performance.now() - queryStartTime).toFixed(2));

      if (isTimeout) {
        return {
          queryIndex,
          domain,
          recordType,
          roundIndex,
          isFirstObserved,
          startTime: queryStartTime,
          latencyMs,
          success: false,
          errorType: 'timeout',
          errorMessage: `Query timed out after ${timeoutMs}ms`,
        };
      }

      if (parentSignal?.aborted) {
        return {
          queryIndex,
          domain,
          recordType,
          roundIndex,
          isFirstObserved,
          startTime: queryStartTime,
          latencyMs,
          success: false,
          errorType: 'network',
          errorMessage: 'Query cancelled by user',
        };
      }

      const message = err instanceof Error ? err.message : 'Unknown network failure';
      // Detect potential CORS errors (typical in browsers when CORS headers are omitted)
      const isCorsLikely = message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('networkerror');

      return {
        queryIndex,
        domain,
        recordType,
        roundIndex,
        isFirstObserved,
        startTime: queryStartTime,
        latencyMs,
        success: false,
        errorType: isCorsLikely ? 'cors_error' : 'network',
        errorMessage: isCorsLikely
          ? 'Network or CORS policy blocked browser request'
          : message,
      };
    } finally {
      clearTimeout(timeoutTimer);
      if (parentSignal) {
        parentSignal.removeEventListener('abort', onParentAbort);
      }
    }
  }
}
