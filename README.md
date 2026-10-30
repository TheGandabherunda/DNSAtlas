# DNSAtlas

> **Open-Source DNS Discovery, Benchmarking & Configuration Platform**

[![CI / CD](https://github.com/DNSAtlas/DNSAtlas/actions/workflows/ci-deploy.yml/badge.svg)](https://github.com/DNSAtlas/DNSAtlas/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Telemetry](https://img.shields.io/badge/Telemetry-Zero-emerald.svg)](#core-principles)
[![Provider Neutral](https://img.shields.io/badge/Ranking-Provider%20Neutral-cyan.svg)](#provider-neutrality)

**DNSAtlas** is a production-quality, provider-neutral, fully open-source web application designed to help users discover, benchmark, compare, and configure public DNS resolvers across all major operating systems.

DNSAtlas is **not** a simple "speed-test" toy. It is built as a scientific networking utility that respects user privacy, transparently explains browser sandbox limitations, and provides verifiable, objective measurements.

---

## 📑 Table of Contents

- [Core Principles](#core-principles)
- [Application Navigation & Features](#application-navigation--features)
- [Benchmarking Methodology & Scientific Integrity](#benchmarking-methodology--scientific-integrity)
- [Supported Platforms & Devices](#supported-platforms--devices)
- [Technology Stack](#technology-stack)
- [Local Development](#local-development)
- [Testing & Validation](#testing--validation)
- [Contributing](#contributing)
- [Security & Privacy](#security--privacy)
- [License](#license)

---

## 🧭 Core Principles

These principles are non-negotiable and govern the entire DNSAtlas project:

* **100% Free & Open Source:** Licensed under the MIT License with zero proprietary dependencies or paid API requirements.
* **Provider Neutrality:** All DNS providers receive strictly equal treatment.
* **Alphabetical Sorting by Default:** Providers are presented alphabetically. Latency-based sorting occurs only when explicitly selected by the user.
* **Zero Editorial Scoring:** No star ratings, medals, provider endorsements, "winner" badges, or promotional placements.
* **Empirical Measurements Only:** No fabricated or simulated benchmark data.
* **Zero Telemetry & User Privacy:** No user accounts, no third-party analytics trackers, no tracking pixels, and no cloud-side result storage. Benchmark results reside strictly in the user's browser (IndexedDB).
* **Honest Technical Disclosures:** Clearly documents browser-based measurement boundaries (e.g. DoH response latency vs raw UDP/TCP transit; OS sandbox limitations).

---

## 🚀 Application Navigation & Features

DNSAtlas is organized into six primary sections accessible via a responsive persistent navigation interface:

1. **Dashboard (Benchmarking Engine):**
   * Configurable query counts (Quick 3q, Standard 10q, Detailed 25q, Extensive 50q, Custom 1-100q).
   * Benchmark profiles: **Repeated-query** (resolver cache behavior) and **Varied-query** (50-domain controlled dataset).
   * Conservative concurrency (default: 1) with high-resolution `performance.now()` timing.
   * Real-time paired-round execution monitor with cancellation controls.
   * Objective results presentation (Average, Median, Min, Max, P90, P95, Jitter, Success Rate, Failed/Timeout counts).
   * Interactive visualizations with Recharts (Latency comparison bars, query timeline, reliability distribution).
   * Individual query inspector drill-down modal showing exact domain, record type, RCODE, answers, and error traces.

2. **DNS Explorer (Registry & Filtering):**
   * Multi-faceted filtering across Country of Origin, Operating Jurisdiction, Privacy Claims, Independent Audits, ECS Stripping, Domain Filtering modes, and Supported Protocols.
   * Comprehensive verified profiles for 17+ resolvers (Cloudflare, Quad9, Google, AdGuard, Control D, DNS0.eu, Mullvad, NextDNS, LibreDNS, CleanBrowsing, CIRA Canadian Shield, DNS.SB, and more).
   * Four dedicated profile tabs: Overview, Performance, Endpoints & Configuration, and Compare.

3. **Compare (Multi-Provider Side-by-Side):**
   * Compare up to 6 providers side-by-side across encryption standards (DoH, DoT, DoQ), jurisdiction exposure, privacy policies, and live local latency metrics.

4. **Setup Guides (Interactive Device Configuration):**
   * Step-by-step verified instructions for:
     * **Desktop:** Windows 11, Windows 10, macOS (Ventura, Sonoma, Sequoia), Linux (systemd-resolved / NetworkManager).
     * **Mobile:** Android (9+ Private DNS DoT), iOS / iPadOS (14+ Encrypted Profiles).
     * **Browsers:** Google Chrome, Mozilla Firefox, Microsoft Edge.
     * **Routers:** Gateway WAN setup, OpenWrt, DD-WRT.
   * One-click downloadable Apple `.mobileconfig` signed/unsigned XML profiles for iOS and macOS.
   * Copyable values, terminal commands, prerequisites, and troubleshooting hints.

5. **Check My DNS (Diagnostics):**
   * Client-side diagnostic suite testing browser DoH connectivity, DNSSEC validation enforcement (`dnssec-failed.org`), and ad/malware sinkhole detection.
   * Results tagged with verified confidence levels: **Verified**, **Inferred**, or **Not Detectable (Sandbox)**.
   * Honest explanation of browser sandbox restrictions (JavaScript cannot read OS `/etc/resolv.conf` or network adapter settings directly).

6. **Settings & Custom Providers:**
   * Theme switcher (Dark, Light, System).
   * Benchmark defaults configuration (Profile, timeout, concurrency).
   * Custom DNS-over-HTTPS endpoint manager with live connectivity verification.
   * Privacy controls: Clear local IndexedDB history and LocalStorage with one click.

---

## 🔬 Benchmarking Methodology & Scientific Integrity

### 1. DNS Wire Format Parser (RFC 1035 & RFC 8484)
DNSAtlas includes a pure, zero-dependency TypeScript implementation of the RFC 1035 / RFC 8484 DNS binary wire format:
- Encodes DNS question labels with length-prefixed octets.
- Parses DNS headers (ID, QR, Opcode, AA, TC, RD, RA, RCODE).
- Decompresses pointer labels (`0xC000` pointers) with infinite loop cycle protection.
- Decodes Resource Records (A, AAAA, CNAME, TXT, PTR, NS).
- Correctly treats `NXDOMAIN` (RCODE 3) as a valid DNS resolution answer rather than a transport error.
- Distinguishes DNS response errors (`SERVFAIL`, `REFUSED`) from network/HTTP/CORS faults.

### 2. Paired Testing Rounds & Shuffling
To eliminate time-varying ISP network latency bias:
- Every selected provider receives equivalent questions in synchronized rounds.
- Within each round, execution order is deterministically shuffled using Mulberry32 PRNG with a recorded seed.
- Concurrency defaults to 1 to avoid local browser socket exhaustion.

### 3. Jitter Calculation
Jitter is calculated in strict compliance with RFC 3550 networking standards:
$$\text{Jitter} = \frac{1}{N - 1} \sum_{i=1}^{N-1} |\text{Latency}_{i+1} - \text{Latency}_{i}|$$
Defined as the mean absolute difference between consecutive successful measurements.

### 4. Connection Measurement Transparency
DNSAtlas distinguishes the first observed request from subsequent requests over potentially reused HTTP/2 or HTTP/3 connections. Failed requests are never mixed into successful latency averages.

---

## 💻 Supported Platforms & Devices

| Platform | Supported Transports | Setup Method |
| :--- | :--- | :--- |
| **Windows 11** | DoH, IPv4, IPv6 | Settings > Network & Internet > DNS Encryption |
| **Windows 10** | IPv4, IPv6 | Control Panel / Settings Network Adapter |
| **macOS (11+)** | DoH, DoT, IPv4, IPv6 | System Settings / `.mobileconfig` Profile |
| **iOS / iPadOS (14+)**| DoH, DoT, IPv4 | `.mobileconfig` Encrypted DNS Profile |
| **Android (9+)** | DoT | Settings > Network > Private DNS Hostname |
| **Linux** | DoT, IPv4, IPv6 | `systemd-resolved` / `NetworkManager` |
| **Chrome / Edge** | DoH | Settings > Privacy & Security > Use Secure DNS |
| **Firefox** | DoH | Settings > Privacy > Max / Increased Protection |
| **Routers** | IPv4, IPv6 | Router Gateway WAN / DHCP DNS Assignment |

---

## 🛠 Technology Stack

* **Frontend:** React 18, TypeScript (Strict Mode), Vite
* **Styling:** Tailwind CSS, Lucide Icons
* **Visualizations:** Recharts
* **Data & Schema:** Zod, JSON Registry
* **Storage:** IndexedDB (`idb`), LocalStorage
* **Networking:** Native Fetch API, RFC 8484 DNS-over-HTTPS, RFC 1035 Wire Parser
* **Testing:** Vitest, React Testing Library, Jest DOM, Playwright
* **Deployment:** GitHub Pages, GitHub Actions

All production and development dependencies are licensed under OSI-approved permissive open-source licenses (MIT, Apache 2.0, BSD-3-Clause).

---

## 📦 Local Development

### Prerequisites
* Node.js 18+ (tested on Node 20 and 22 LTS)
* npm 9+

### Setup & Run
```bash
# Clone repository
git clone https://github.com/DNSAtlas/DNSAtlas.git
cd DNSAtlas

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Testing & Validation

```bash
# Run unit tests (DNS wire parser, statistical math, benchmark engine, export validation)
npm test

# Run provider database strict schema validation
npm run validate:providers

# Run linter
npm run lint

# Compile TypeScript and build production bundle
npm run build
```

---

## 🤝 Contributing

We welcome community contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before submitting a pull request.

To add or update a DNS provider:
1. Edit `src/data/providers.ts`.
2. Ensure all required fields, official sources, and HTTPS endpoints are present.
3. Run `npm run validate:providers` to verify schema conformance.
4. Open a pull request using our [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).

---

## 🔒 Security & Privacy

DNSAtlas is strictly client-side. No identifiable network information, IP addresses, or lookup histories are transmitted to any central server. For vulnerability reports, please consult [SECURITY.md](SECURITY.md).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

