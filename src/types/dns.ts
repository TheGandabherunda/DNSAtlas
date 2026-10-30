export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'PTR' | 'SOA' | 'HTTPS';

export type DnsRcode =
  | 'NOERROR'
  | 'FORMERR'
  | 'SERVFAIL'
  | 'NXDOMAIN'
  | 'NOTIMP'
  | 'REFUSED'
  | 'YXDOMAIN'
  | 'YXRRSET'
  | 'NXRRSET'
  | 'NOTAUTH'
  | 'NOTZONE'
  | 'UNKNOWN';

export type DnsProtocol = 'doh' | 'dot' | 'doq' | 'udp' | 'tcp' | 'ipv4' | 'ipv6';

export type FilteringCategory =
  | 'unfiltered'
  | 'malware'
  | 'phishing'
  | 'ads'
  | 'trackers'
  | 'adult'
  | 'family'
  | 'gambling';

export type ProviderCategory =
  | 'general'
  | 'privacy'
  | 'security'
  | 'family'
  | 'unfiltered'
  | 'regional'
  | 'isp'
  | 'custom';

export type LoggingPolicyClaim =
  | 'no-logging'
  | 'minimal-diagnostics'
  | 'full-query-logging'
  | 'anonymized-aggregate';

export interface DohEndpoint {
  url: string;
  method: 'POST' | 'GET' | 'BOTH';
  browserCorsSupported: boolean;
  corsNotes?: string;
  name?: string;
}

export interface DotEndpoint {
  hostname: string;
  port?: number;
  name?: string;
}

export interface DoqEndpoint {
  url: string;
  port?: number;
  name?: string;
}

export interface SourceReference {
  title: string;
  url: string;
  verifiedDate: string;
}

export interface DnsProvider {
  id: string;
  name: string;
  category: ProviderCategory;
  description: string;
  website: string;
  countryOfOrigin: string;
  operatingJurisdiction: string;
  infrastructureLocations: string;
  loggingPolicy: {
    claim: LoggingPolicyClaim;
    retentionPeriod: string;
    clientSubnetStripping: boolean;
    independentAudit: {
      audited: boolean;
      auditor?: string;
      auditDate?: string;
      auditReportUrl?: string;
    };
    details: string;
    gdprCompliant: boolean;
  };
  filtering: {
    enabled: boolean;
    categories: FilteringCategory[];
    customizable: boolean;
    details: string;
  };
  dnssec: {
    supported: boolean;
    validation: boolean;
    details: string;
  };
  protocols: {
    doh: boolean;
    dot: boolean;
    doq: boolean;
    udp: boolean;
    tcp: boolean;
    ipv4: boolean;
    ipv6: boolean;
  };
  endpoints: {
    ipv4: string[];
    ipv6: string[];
    doh: DohEndpoint[];
    dot: DotEndpoint[];
    doq: DoqEndpoint[];
  };
  licensing: {
    free: boolean;
    commercialAvailable: boolean;
    openSourceResolver: boolean;
    selfHostable: boolean;
  };
  setup: {
    androidPrivateDnsHostname?: string;
    appleMobileconfigSupported?: boolean;
    routerConfigNotes?: string;
  };
  sources: SourceReference[];
  lastVerified: string;
  isCustom?: boolean;
}

export type BenchmarkProfile = 'repeated' | 'varied';

export type ConnectionMeasurementMode = 'mixed' | 'separate-first' | 'warm-only';

export interface BenchmarkConfig {
  queriesPerProvider: number;
  timeoutMs: number;
  concurrency: number;
  profile: BenchmarkProfile;
  recordType: DnsRecordType;
  customDomains?: string[];
  connectionMode: ConnectionMeasurementMode;
}

export interface QueryMeasurement {
  queryIndex: number;
  domain: string;
  recordType: DnsRecordType;
  roundIndex: number;
  isFirstObserved: boolean;
  startTime: number;
  httpStatus?: number;
  dnsRcode?: DnsRcode;
  answersCount?: number;
  answers?: string[];
  latencyMs: number;
  success: boolean;
  errorType?: 'timeout' | 'network' | 'http_error' | 'cors_error' | 'dns_parse_error' | 'dns_rcode_error';
  errorMessage?: string;
}

export interface ProviderBenchmarkSummary {
  providerId: string;
  providerName: string;
  endpointUrl: string;
  protocol: 'DoH';
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  timeoutCount: number;
  firstRequestLatencyMs?: number;
  warmAverageLatencyMs?: number;
  overallAverageLatencyMs: number;
  medianLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  jitterMs: number;
  successRate: number;
  measurements: QueryMeasurement[];
}

export interface BenchmarkSession {
  id: string;
  timestamp: string;
  config: BenchmarkConfig;
  randomSeed: number;
  providerSummaries: ProviderBenchmarkSummary[];
  notes?: string;
}
