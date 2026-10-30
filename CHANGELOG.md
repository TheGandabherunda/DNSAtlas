# Changelog

All notable changes to **DNSAtlas** will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-31

### Added
- **Core DNS Benchmarking Engine:**
  - RFC 1035 and RFC 8484 compliant DNS wire-format parser and query builder.
  - High-resolution `performance.now()` response latency measurement.
  - Paired rounds with deterministic pseudo-random shuffling (Mulberry32) to eliminate temporal bias.
  - Caching profiles: Repeated-query profile and 50-domain Varied-query profile.
  - RFC 3550 jitter calculation (mean absolute consecutive difference).
  - Exact percentile calculations (Median, P90, P95).
  - Connection reuse tracking (first observed vs warm requests).
  - Fine-grained error classification: timeout, network, CORS, HTTP status, and DNS RCODE errors (`NXDOMAIN`, `SERVFAIL`, `REFUSED`).
- **Comprehensive DNS Provider Directory:**
  - Strict Zod schema validation script (`scripts/validate-providers.ts`).
  - 17 verified DNS resolvers covering Cloudflare, Google, Quad9, AdGuard, Control D, DNS0.eu, Mullvad, NextDNS, LibreDNS, CleanBrowsing, CIRA Canadian Shield, and DNS.SB.
  - Distinct separation of Country of Origin, Operating Jurisdiction, and Infrastructure Locations.
  - Multi-faceted filtering by jurisdiction, privacy, audit, domain filtering, and protocols.
  - Alphabetical sorting by default; zero provider endorsements or ratings.
- **Interactive Device Setup Guides:**
  - Step-by-step verified instructions for Windows 11, Windows 10, macOS, Linux, Android, iOS, Chrome, Firefox, and Routers.
  - Dynamic Apple `.mobileconfig` signed/unsigned profile generator for iOS 14+ and macOS 11+.
  - Copyable configuration values and CLI snippets.
- **Check My DNS Diagnostic Suite:**
  - Browser DoH direct connectivity probe.
  - Cryptographic DNSSEC validation enforcement probe (`dnssec-failed.org`).
  - Ad/malware sinkhole blocklist probe.
  - Transparent disclosure of browser sandbox limitations and lack of OS network file access.
- **History, Export & Settings:**
  - Local IndexedDB storage for benchmark sessions.
  - Full JSON and CSV export/import capabilities.
  - Custom user-defined DoH endpoints with live test verification.
  - Dark, Light, and System theme support with Tailwind CSS.
- **Automated Quality Assurance:**
  - 37 unit and integration tests across DNS wire encoding, stats, benchmarking engine, mobileconfig generation, export validation, and UI navigation.
  - Strict TypeScript configuration.
  - ESLint 9 configuration with zero errors or warnings.
  - GitHub Actions CI/CD pipeline building and deploying to GitHub Pages.

