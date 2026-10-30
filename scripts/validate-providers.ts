import { DNS_PROVIDERS } from '../src/data/providers';
import { DnsProvidersListSchema } from '../src/data/schema';

export function validateProviderDatabase() {
  console.log(`[Validator] Validating ${DNS_PROVIDERS.length} DNS providers...`);

  // 1. Zod schema validation
  const parseResult = DnsProvidersListSchema.safeParse(DNS_PROVIDERS);
  if (!parseResult.success) {
    console.error('[Validator Error] Schema validation failed:');
    console.error(JSON.stringify(parseResult.error.format(), null, 2));
    throw new Error('Provider schema validation failed');
  }

  // 2. Duplicate identifier check
  const ids = new Set<string>();
  for (const provider of DNS_PROVIDERS) {
    if (ids.has(provider.id)) {
      throw new Error(`Duplicate provider id found: ${provider.id}`);
    }
    ids.add(provider.id);
  }

  // 3. Alphabetical sanity or sorting validation check
  // The system should sort alphabetically by default in the UI, but let's check that providers are well-formed
  for (const provider of DNS_PROVIDERS) {
    // Validate DoH URLs start with https://
    for (const doh of provider.endpoints.doh) {
      if (!doh.url.startsWith('https://')) {
        throw new Error(`Provider ${provider.id} DoH endpoint must use HTTPS: ${doh.url}`);
      }
    }

    // Validate Sources
    if (provider.sources.length === 0) {
      throw new Error(`Provider ${provider.id} must have at least one verified source reference`);
    }

    for (const source of provider.sources) {
      if (!source.url.startsWith('https://')) {
        throw new Error(`Provider ${provider.id} source reference must use HTTPS: ${source.url}`);
      }
    }
  }

  console.log(`[Validator Success] All ${DNS_PROVIDERS.length} providers passed strict validation!`);
  return true;
}

// Execute when run directly via tsx
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('validate-providers')) {
  try {
    validateProviderDatabase();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

