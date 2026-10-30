export const REPEATED_QUERY_DOMAINS = [
  'cloudflare.com',
];

export const VARIED_QUERY_DOMAINS = [
  'wikipedia.org',
  'ietf.org',
  'mozilla.org',
  'eff.org',
  'archive.org',
  'apache.org',
  'kernel.org',
  'gnu.org',
  'w3.org',
  'icann.org',
  'iana.org',
  'freebsd.org',
  'python.org',
  'debian.org',
  'nist.gov',
  'un.org',
  'cern.ch',
  'mit.edu',
  'stanford.edu',
  'ox.ac.uk',
  'cam.ac.uk',
  'berkeley.edu',
  'ethz.ch',
  'nasa.gov',
  'who.int',
  'unesco.org',
  'openstreetmap.org',
  'github.com',
  'gitlab.com',
  'kernel.org',
  'kernel.org',
  'eff.org',
  'torproject.org',
  'curl.se',
  'openbsd.org',
  'netbsd.org',
  'rust-lang.org',
  'golang.org',
  'openssl.org',
  'vlc.org',
  'blender.org',
  'libreoffice.org',
  'postgresql.org',
  'mariadb.org',
  'sqlite.org',
  'redis.io',
  'isc.org',
  'ripe.net',
  'apnic.net',
  'arin.net',
];

export function getDomainForRound(
  profile: 'repeated' | 'varied',
  roundIndex: number,
  customDomains?: string[]
): string {
  if (customDomains && customDomains.length > 0) {
    return customDomains[roundIndex % customDomains.length];
  }

  if (profile === 'repeated') {
    return REPEATED_QUERY_DOMAINS[0];
  }

  return VARIED_QUERY_DOMAINS[roundIndex % VARIED_QUERY_DOMAINS.length];
}
