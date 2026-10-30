import { DnsProvider } from '../types/dns';

export type SupportedPlatform =
  | 'windows-11'
  | 'windows-10'
  | 'macos'
  | 'linux'
  | 'android'
  | 'ios'
  | 'chrome'
  | 'firefox'
  | 'edge'
  | 'router';

export interface GuideStep {
  stepNumber: number;
  instruction: string;
  copyValue?: string;
  notes?: string;
}

export interface PlatformGuide {
  platformId: SupportedPlatform;
  platformName: string;
  category: 'desktop' | 'mobile' | 'browser' | 'network';
  supportedProtocols: ('IPv4' | 'IPv6' | 'DoH' | 'DoT' | 'MobileConfig')[];
  prerequisites: string[];
  steps: (provider: DnsProvider, protocol: string) => GuideStep[];
  troubleshooting: string[];
  commandSnippets?: (provider: DnsProvider) => { label: string; command: string }[];
}

export const PLATFORM_GUIDES: PlatformGuide[] = [
  {
    platformId: 'windows-11',
    platformName: 'Windows 11',
    category: 'desktop',
    supportedProtocols: ['DoH', 'IPv4', 'IPv6'],
    prerequisites: [
      'Windows 11 Build 22000 or higher',
      'Administrator access on your user account',
    ],
    steps: (provider, protocol) => {
      const ipv4Primary = provider.endpoints.ipv4[0] || '1.1.1.1';
      const ipv4Secondary = provider.endpoints.ipv4[1] || '1.0.0.1';
      const dohUrl = provider.endpoints.doh[0]?.url || 'https://cloudflare-dns.com/dns-query';

      if (protocol === 'DoH') {
        return [
          {
            stepNumber: 1,
            instruction: 'Open Settings by pressing Win + I, then navigate to Network & internet.',
          },
          {
            stepNumber: 2,
            instruction: 'Click on your active connection (Wi-Fi or Ethernet).',
          },
          {
            stepNumber: 3,
            instruction: 'Click "Edit" next to "DNS server assignment" and switch from Automatic (DHCP) to "Manual".',
          },
          {
            stepNumber: 4,
            instruction: 'Toggle IPv4 to "On", and enter the Preferred DNS server IP.',
            copyValue: ipv4Primary,
          },
          {
            stepNumber: 5,
            instruction: 'Under "Preferred DNS encryption", select "Encrypted only (DNS over HTTPS)" or "Encrypted preferred". If prompt requests template, paste the DoH endpoint template.',
            copyValue: dohUrl,
            notes: 'Windows 11 natively supports DoH templates for known providers.',
          },
          {
            stepNumber: 6,
            instruction: 'Enter the Alternate DNS server IP if available, and click Save.',
            copyValue: ipv4Secondary,
          },
        ];
      }

      return [
        {
          stepNumber: 1,
          instruction: 'Open Settings (Win + I) > Network & internet > Wi-Fi or Ethernet.',
        },
        {
          stepNumber: 2,
          instruction: 'Click "Edit" next to "DNS server assignment" and choose "Manual".',
        },
        {
          stepNumber: 3,
          instruction: 'Toggle IPv4 to "On" and input the primary IPv4 address.',
          copyValue: ipv4Primary,
        },
        {
          stepNumber: 4,
          instruction: 'Input the secondary IPv4 address.',
          copyValue: ipv4Secondary,
        },
        {
          stepNumber: 5,
          instruction: 'Click Save to apply network changes.',
        },
      ];
    },
    troubleshooting: [
      'If DoH shows "Unencrypted only", ensure the IP address entered matches a known DoH template or register it using netsh.',
      'Flush the Windows DNS client cache via PowerShell: Clear-DnsClientCache.',
    ],
    commandSnippets: (provider) => [
      {
        label: 'Register DoH Template in PowerShell (Admin)',
        command: `netsh dns add encryption server=${provider.endpoints.ipv4[0] || '1.1.1.1'} dohtemplate="${provider.endpoints.doh[0]?.url || 'https://cloudflare-dns.com/dns-query'}" autoupgrade=yes udp-fallback=no`,
      },
      {
        label: 'Flush DNS Cache',
        command: 'ipconfig /flushdns',
      },
    ],
  },
  {
    platformId: 'macos',
    platformName: 'macOS (Ventura / Sonoma / Sequoia)',
    category: 'desktop',
    supportedProtocols: ['MobileConfig', 'DoH', 'IPv4', 'IPv6'],
    prerequisites: [
      'macOS 11 (Big Sur) or newer for Encrypted DNS Profiles (.mobileconfig)',
      'macOS 13+ (Ventura, Sonoma, Sequoia) for redesigned System Settings UI',
    ],
    steps: (provider, protocol) => {
      const ipv4Primary = provider.endpoints.ipv4[0] || '1.1.1.1';
      const ipv4Secondary = provider.endpoints.ipv4[1] || '1.0.0.1';

      if (protocol === 'MobileConfig') {
        return [
          {
            stepNumber: 1,
            instruction: 'Download the DNSAtlas .mobileconfig configuration profile using the "Download Profile" button below.',
          },
          {
            stepNumber: 2,
            instruction: 'Open System Settings > Privacy & Security > Profiles (or search "Profiles" in System Settings).',
          },
          {
            stepNumber: 3,
            instruction: `Double click on "DNSAtlas — ${provider.name}" and click "Install...". Confirm using your Mac administrator password.`,
            notes: 'macOS enforces system-wide encrypted DNS (DoH/DoT) for all network interfaces with this profile.',
          },
        ];
      }

      return [
        {
          stepNumber: 1,
          instruction: 'Open Apple Menu > System Settings > Network.',
        },
        {
          stepNumber: 2,
          instruction: 'Select your active network connection (Wi-Fi or Ethernet) and click "Details...".',
        },
        {
          stepNumber: 3,
          instruction: 'Click the "DNS" tab on the left sidebar.',
        },
        {
          stepNumber: 4,
          instruction: 'Click the "+" button and add the primary IPv4 address.',
          copyValue: ipv4Primary,
        },
        {
          stepNumber: 5,
          instruction: 'Click "+" again to add the secondary IPv4 address.',
          copyValue: ipv4Secondary,
        },
        {
          stepNumber: 6,
          instruction: 'Click "OK" to apply changes.',
        },
      ];
    },
    troubleshooting: [
      'To remove a profile, go to System Settings > Privacy & Security > Profiles, select the profile, and click the "-" button.',
      'Flush macOS DNS cache via Terminal: sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder',
    ],
    commandSnippets: () => [
      {
        label: 'Flush macOS DNS Cache',
        command: 'sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder',
      },
    ],
  },
  {
    platformId: 'linux',
    platformName: 'Linux (systemd-resolved / NetworkManager)',
    category: 'desktop',
    supportedProtocols: ['DoT', 'IPv4', 'IPv6'],
    prerequisites: [
      'systemd-resolved enabled for DNS-over-TLS (DoT)',
      'Root or sudo privileges',
    ],
    steps: (provider, protocol) => {
      const dotHostname = provider.endpoints.dot[0]?.hostname || 'dns.quad9.net';
      const ipv4Primary = provider.endpoints.ipv4[0] || '9.9.9.9';

      if (protocol === 'DoT') {
        return [
          {
            stepNumber: 1,
            instruction: 'Open /etc/systemd/resolved.conf in your favorite editor with sudo privileges.',
            copyValue: 'sudo nano /etc/systemd/resolved.conf',
          },
          {
            stepNumber: 2,
            instruction: 'Under the [Resolve] section, set DNS and DNSOverTLS parameters.',
            copyValue: `[Resolve]\nDNS=${ipv4Primary}#${dotHostname}\nDNSOverTLS=yes\nDNSSEC=yes`,
          },
          {
            stepNumber: 3,
            instruction: 'Restart systemd-resolved to apply the encrypted DNS configuration.',
            copyValue: 'sudo systemctl restart systemd-resolved',
          },
          {
            stepNumber: 4,
            instruction: 'Verify active encrypted resolver status.',
            copyValue: 'resolvectl status',
          },
        ];
      }

      return [
        {
          stepNumber: 1,
          instruction: 'Configure DNS in NetworkManager using nmcli or GUI connection settings.',
          copyValue: `nmcli con mod "YourConnection" ipv4.dns "${provider.endpoints.ipv4.join(' ')}"`,
        },
        {
          stepNumber: 2,
          instruction: 'Reactivate connection to apply changes.',
          copyValue: 'nmcli con up "YourConnection"',
        },
      ];
    },
    troubleshooting: [
      'If systemd-resolved fails to establish TLS, verify port 853 is not blocked by local iptables/ufw or ISP firewall.',
      'Check resolver status with: resolvectl status',
    ],
  },
  {
    platformId: 'android',
    platformName: 'Android (9+ Private DNS)',
    category: 'mobile',
    supportedProtocols: ['DoT', 'IPv4'],
    prerequisites: [
      'Android 9 (Pie) or higher for system-wide Private DNS (DoT)',
    ],
    steps: (provider) => {
      const dotHostname = provider.endpoints.dot[0]?.hostname || provider.setup.androidPrivateDnsHostname || 'dns.quad9.net';

      return [
        {
          stepNumber: 1,
          instruction: 'Open device Settings > Network & internet (or Connections).',
        },
        {
          stepNumber: 2,
          instruction: 'Tap on "Private DNS" (may be under "More connection settings" on Samsung devices).',
        },
        {
          stepNumber: 3,
          instruction: 'Select "Private DNS provider hostname".',
        },
        {
          stepNumber: 4,
          instruction: 'Enter the provider DoT hostname and tap Save.',
          copyValue: dotHostname,
          notes: 'Android Private DNS exclusively uses DNS-over-TLS (DoT) on port 853. Do not include https:// in the hostname.',
        },
      ];
    },
    troubleshooting: [
      'If Android displays "Couldn\'t connect", verify that your network does not block TCP port 853 (common on some public guest Wi-Fi networks).',
      'Ensure you entered the hostname without protocol prefixes (no "tls://" or "https://").',
    ],
  },
  {
    platformId: 'ios',
    platformName: 'iOS / iPadOS (14+)',
    category: 'mobile',
    supportedProtocols: ['MobileConfig', 'IPv4'],
    prerequisites: [
      'iOS 14 or higher for encrypted DNS profile support',
    ],
    steps: (provider, protocol) => {
      if (protocol === 'MobileConfig') {
        return [
          {
            stepNumber: 1,
            instruction: 'Download the configuration profile from DNSAtlas in Safari using the "Download Profile" button.',
          },
          {
            stepNumber: 2,
            instruction: 'When Safari asks "This website is trying to download a configuration profile. Do you want to allow this?", tap "Allow".',
          },
          {
            stepNumber: 3,
            instruction: 'Open Settings > Profile Downloaded (near the top) or Settings > General > VPN & Device Management.',
          },
          {
            stepNumber: 4,
            instruction: `Tap on "DNSAtlas — ${provider.name}" and tap "Install" in the upper right. Enter your passcode to confirm.`,
            notes: 'iOS will now route all system DNS queries over encrypted DNS (DoH/DoT) across all cellular and Wi-Fi networks.',
          },
        ];
      }

      return [
        {
          stepNumber: 1,
          instruction: 'Open Settings > Wi-Fi, and tap the (i) info icon next to your connected Wi-Fi network.',
        },
        {
          stepNumber: 2,
          instruction: 'Scroll down to "Configure DNS" and tap "Manual".',
        },
        {
          stepNumber: 3,
          instruction: 'Remove existing servers, tap "Add Server", and enter the primary IPv4 address.',
          copyValue: provider.endpoints.ipv4[0] || '1.1.1.1',
        },
        {
          stepNumber: 4,
          instruction: 'Tap Save in the upper right corner.',
        },
      ];
    },
    troubleshooting: [
      'To disable or remove an encrypted DNS profile on iOS, go to Settings > General > VPN & Device Management, select the profile, and tap "Remove Profile".',
      'VPN apps or enterprise MDM configurations may override custom DNS profiles.',
    ],
  },
  {
    platformId: 'chrome',
    platformName: 'Google Chrome / Chromium',
    category: 'browser',
    supportedProtocols: ['DoH'],
    prerequisites: ['Google Chrome 85+ or Chromium-based browser'],
    steps: (provider) => {
      const dohUrl = provider.endpoints.doh[0]?.url || 'https://cloudflare-dns.com/dns-query';
      return [
        {
          stepNumber: 1,
          instruction: 'Open Chrome Settings by navigating to chrome://settings/security.',
        },
        {
          stepNumber: 2,
          instruction: 'Scroll down to the "Advanced" section and find "Use secure DNS".',
        },
        {
          stepNumber: 3,
          instruction: 'Select "With" and choose "Custom" from the dropdown menu.',
        },
        {
          stepNumber: 4,
          instruction: 'Paste the provider DoH endpoint URL.',
          copyValue: dohUrl,
        },
      ];
    },
    troubleshooting: [
      'If Chrome indicates "Verify that this is a valid provider URL", check that the URL begins with https://.',
      'Managed work/school devices with Chrome enterprise policies may lock secure DNS settings.',
    ],
  },
  {
    platformId: 'firefox',
    platformName: 'Mozilla Firefox',
    category: 'browser',
    supportedProtocols: ['DoH'],
    prerequisites: ['Mozilla Firefox 75+'],
    steps: (provider) => {
      const dohUrl = provider.endpoints.doh[0]?.url || 'https://cloudflare-dns.com/dns-query';
      return [
        {
          stepNumber: 1,
          instruction: 'Open Firefox Settings > Privacy & Security, and scroll down to "DNS over HTTPS".',
        },
        {
          stepNumber: 2,
          instruction: 'Select "Increased Protection" or "Max Protection".',
        },
        {
          stepNumber: 3,
          instruction: 'Under "Choose provider", select "Custom" from the dropdown.',
        },
        {
          stepNumber: 4,
          instruction: 'Enter the provider DoH endpoint URL.',
          copyValue: dohUrl,
        },
      ];
    },
    troubleshooting: [
      'In "Max Protection" mode, Firefox will refuse to resolve if the DoH server is unreachable (strict fallback prevention).',
    ],
  },
  {
    platformId: 'router',
    platformName: 'Home / Office Router (Gateway)',
    category: 'network',
    supportedProtocols: ['IPv4', 'IPv6'],
    prerequisites: [
      'Administrative access to your router management page (typically 192.168.1.1 or 192.168.0.1)',
    ],
    steps: (provider) => {
      const primary = provider.endpoints.ipv4[0] || '1.1.1.1';
      const secondary = provider.endpoints.ipv4[1] || '1.0.0.1';
      return [
        {
          stepNumber: 1,
          instruction: 'Log into your router administration dashboard in a web browser.',
        },
        {
          stepNumber: 2,
          instruction: 'Navigate to WAN Settings, Internet Setup, or DHCP Server Settings.',
        },
        {
          stepNumber: 3,
          instruction: 'Locate the DNS server fields (often labeled Primary DNS and Secondary DNS).',
        },
        {
          stepNumber: 4,
          instruction: 'Enter the primary IPv4 address.',
          copyValue: primary,
        },
        {
          stepNumber: 5,
          instruction: 'Enter the secondary IPv4 address.',
          copyValue: secondary,
        },
        {
          stepNumber: 6,
          instruction: 'Save settings and restart connected client devices or renew their DHCP leases.',
          notes: 'Router DNS changes automatically protect every device connected to your Wi-Fi or LAN without individual device configuration.',
        },
      ];
    },
    troubleshooting: [
      'Some ISP-provided routers do not permit changing WAN DNS. In such cases, configure DNS directly on individual devices or install an intermediate router.',
    ],
  },
];
