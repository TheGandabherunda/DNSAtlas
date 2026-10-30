import { z } from 'zod';

export const DohEndpointSchema = z.object({
  url: z.string().url(),
  method: z.enum(['POST', 'GET', 'BOTH']),
  browserCorsSupported: z.boolean(),
  corsNotes: z.string().optional(),
  name: z.string().optional(),
});

export const DotEndpointSchema = z.object({
  hostname: z.string().min(1),
  port: z.number().int().positive().optional(),
  name: z.string().optional(),
});

export const DoqEndpointSchema = z.object({
  url: z.string().min(1),
  port: z.number().int().positive().optional(),
  name: z.string().optional(),
});

export const SourceReferenceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  verifiedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const DnsProviderSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  category: z.enum([
    'general',
    'privacy',
    'security',
    'family',
    'unfiltered',
    'regional',
    'isp',
    'custom',
  ]),
  description: z.string().min(10),
  website: z.string().url(),
  countryOfOrigin: z.string().min(2),
  operatingJurisdiction: z.string().min(2),
  infrastructureLocations: z.string().min(2),
  loggingPolicy: z.object({
    claim: z.enum([
      'no-logging',
      'minimal-diagnostics',
      'full-query-logging',
      'anonymized-aggregate',
    ]),
    retentionPeriod: z.string().min(1),
    clientSubnetStripping: z.boolean(),
    independentAudit: z.object({
      audited: z.boolean(),
      auditor: z.string().optional(),
      auditDate: z.string().optional(),
      auditReportUrl: z.string().url().optional(),
    }),
    details: z.string().min(5),
    gdprCompliant: z.boolean(),
  }),
  filtering: z.object({
    enabled: z.boolean(),
    categories: z.array(
      z.enum([
        'unfiltered',
        'malware',
        'phishing',
        'ads',
        'trackers',
        'adult',
        'family',
        'gambling',
      ])
    ),
    customizable: z.boolean(),
    details: z.string(),
  }),
  dnssec: z.object({
    supported: z.boolean(),
    validation: z.boolean(),
    details: z.string(),
  }),
  protocols: z.object({
    doh: z.boolean(),
    dot: z.boolean(),
    doq: z.boolean(),
    udp: z.boolean(),
    tcp: z.boolean(),
    ipv4: z.boolean(),
    ipv6: z.boolean(),
  }),
  endpoints: z.object({
    ipv4: z.array(z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)),
    ipv6: z.array(z.string().min(2)),
    doh: z.array(DohEndpointSchema),
    dot: z.array(DotEndpointSchema),
    doq: z.array(DoqEndpointSchema),
  }),
  licensing: z.object({
    free: z.boolean(),
    commercialAvailable: z.boolean(),
    openSourceResolver: z.boolean(),
    selfHostable: z.boolean(),
  }),
  setup: z.object({
    androidPrivateDnsHostname: z.string().optional(),
    appleMobileconfigSupported: z.boolean().optional(),
    routerConfigNotes: z.string().optional(),
  }),
  sources: z.array(SourceReferenceSchema).min(1),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isCustom: z.boolean().optional(),
});

export const DnsProvidersListSchema = z.array(DnsProviderSchema);

