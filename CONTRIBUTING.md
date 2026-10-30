# Contributing to DNSAtlas

Thank you for your interest in contributing to **DNSAtlas**! As a community-driven, open-source DNS discovery, benchmarking, and configuration platform, we welcome contributions that preserve provider neutrality, scientific accuracy, and code quality.

---

## Code of Conduct

All contributors and participants are expected to adhere to the [Contributor Covenant](CODE_OF_CONDUCT.md).

---

## Core Guidelines & Non-Negotiables

Before submitting code or provider additions, review these principles:
1. **Provider Neutrality:** All providers receive equal treatment. Never submit changes that endorse, promote, or artificially favor any specific provider.
2. **Alphabetical Sorting by Default:** The default ordering of DNS providers in all lists must remain alphabetical.
3. **No Fabricated Measurements:** Never insert hardcoded or simulated benchmark metrics into production provider profiles.
4. **Verified Official Documentation:** When adding or updating DNS providers, you must provide official HTTPS source documentation links.
5. **Zero Telemetry:** Never introduce analytics scripts, telemetry tracking, or external proprietary SDKs.

---

## How to Add or Update a DNS Provider

1. Fork the repository and create a branch:
   ```bash
   git checkout -b provider/add-myprovider
   ```
2. Open `src/data/providers.ts` and add your provider configuration adhering to the `DnsProvider` schema.
3. Validate:
   - Unique lowercase alphanumeric `id` (e.g. `mullvad-dns`).
   - Sourced `privacyPolicyUrl` and `website`.
   - Explicit distinction between `countryOfOrigin`, `operatingJurisdiction`, and `infrastructureLocations`.
   - Verified IPv4, IPv6, DoH, DoT endpoints.
   - At least one official HTTPS source reference URL with verification date.
4. Run validation:
   ```bash
   npm run validate:providers
   npm test
   npm run lint
   npm run build
   ```
5. Submit a pull request using the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).

---

## Local Development Workflow

```bash
# Clone
git clone https://github.com/DNSAtlas/DNSAtlas.git
cd DNSAtlas

# Install
npm install

# Run dev server
npm run dev

# Run unit tests
npm test

# Build
npm run build
```

---

## Pull Request Guidelines

- Ensure your commit messages are descriptive and concise.
- Keep pull requests focused on a single feature, bug fix, or provider addition.
- All CI checks (linting, typechecking, unit tests, schema validation, build) must pass before merging.

