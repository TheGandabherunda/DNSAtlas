import { DnsProvider } from '../types/dns';

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().toUpperCase();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
    .toUpperCase();
}

/**
 * Generates an Apple .mobileconfig XML profile for Encrypted DNS (DoH or DoT)
 * Compatible with iOS 14+ and macOS 11 (Big Sur)+
 */
export function generateAppleMobileConfig(
  provider: DnsProvider,
  protocol: 'DoH' | 'DoT' = 'DoH'
): string {
  const profileUuid = generateUuid();
  const payloadUuid = generateUuid();
  const displayName = `DNSAtlas — ${provider.name} (${protocol})`;
  const identifier = `org.dnsatlas.profile.${provider.id}.${protocol.toLowerCase()}`;
  const payloadIdentifier = `org.dnsatlas.dns.${provider.id}.${protocol.toLowerCase()}`;

  const serverAddressesXml = [
    ...provider.endpoints.ipv4,
    ...provider.endpoints.ipv6,
  ]
    .map((ip) => `        <string>${ip}</string>`)
    .join('\n');

  let dnsSettingsBlock = '';

  if (protocol === 'DoH') {
    const dohUrl = provider.endpoints.doh[0]?.url || 'https://cloudflare-dns.com/dns-query';
    dnsSettingsBlock = `      <key>DNSProtocol</key>
      <string>HTTPS</string>
      <key>ServerURL</key>
      <string>${escapeXml(dohUrl)}</string>`;
  } else {
    const dotHostname = provider.endpoints.dot[0]?.hostname || 'dns.quad9.net';
    dnsSettingsBlock = `      <key>DNSProtocol</key>
      <string>TLS</string>
      <key>ServerName</key>
      <string>${escapeXml(dotHostname)}</string>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>DNSSettings</key>
      <dict>
${dnsSettingsBlock}
        <key>ServerAddresses</key>
        <array>
${serverAddressesXml}
        </array>
      </dict>
      <key>PayloadDescription</key>
      <string>Configures encrypted DNS settings for ${escapeXml(provider.name)}</string>
      <key>PayloadDisplayName</key>
      <string>${escapeXml(displayName)}</string>
      <key>PayloadIdentifier</key>
      <string>${escapeXml(payloadIdentifier)}</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>${payloadUuid}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>DNSAtlas encrypted DNS configuration profile for iOS and macOS</string>
  <key>PayloadDisplayName</key>
  <string>${escapeXml(displayName)}</string>
  <key>PayloadIdentifier</key>
  <string>${escapeXml(identifier)}</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${profileUuid}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/**
 * Initiates browser file download for .mobileconfig
 */
export function downloadAppleProfile(provider: DnsProvider, protocol: 'DoH' | 'DoT' = 'DoH'): void {
  const xml = generateAppleMobileConfig(provider, protocol);
  const blob = new Blob([xml], { type: 'application/x-apple-aspen-config' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${provider.id}-${protocol.toLowerCase()}.mobileconfig`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
