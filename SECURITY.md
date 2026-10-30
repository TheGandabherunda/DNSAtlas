# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

DNSAtlas is committed to privacy, technical integrity, and client security. If you discover a security vulnerability, we appreciate your help in responsibly disclosing it to us.

Please report security issues privately by submitting a GitHub Security Advisory on our repository or contacting the maintainers via security@dnsatlas.org.

Please include:
* Description of the vulnerability.
* Steps to reproduce or proof-of-concept.
* Impact assessment on users or client-side execution.

We will acknowledge receipt within 48 hours and coordinate a public release with attribution once fixed.

### Security Architecture Principles
* **Client-side only:** DNSAtlas does not operate an external database or user session store.
* **HTTPS only:** Custom DoH endpoints must use secure `https://` schemes.
* **No code evaluation:** No `eval()`, `dangerouslySetInnerHTML`, or remote script execution.
* **Zero tracking:** No tracking cookies, analytics tokens, or third-party advertising dependencies.

