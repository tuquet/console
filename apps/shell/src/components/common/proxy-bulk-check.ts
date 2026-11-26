export type ProxyProtocol = 'http' | 'https' | 'socks5' | 'socks5h';

export interface ProxyProbeResult {
  alive: boolean;
  colo?: null | string;
  country?: null | string;
  egressIp?: null | string;
  error?: null | string;
  protocol: string;
  proxyUrl: string;
  rttMs: number;
}

export interface ParsedProxyEntry {
  display: string;
  id: number;
  parseError?: string;
  protocol: string;
  proxyUri: string;
  raw: string;
}

export type ProxyCheckStatus = 'alive' | 'checking' | 'dead' | 'pending';

export interface BulkProxyCheckItem extends ParsedProxyEntry {
  colo?: null | string;
  country?: null | string;
  egressIp?: null | string;
  error?: null | string;
  rttMs?: number;
  status: ProxyCheckStatus;
}

const VALID_PROTOCOLS = new Set<string>(['http', 'https', 'socks5', 'socks5h']);

function isValidPort(portStr: string): boolean {
  if (!/^\d{1,5}$/.test(portStr)) return false;
  const port = Number(portStr);
  return port >= 1 && port <= 65_535;
}

function buildDisplayLabel(url: URL, protocol: string): string {
  return `${protocol}://${url.host}`;
}

function parseSingleProxyLine(
  raw: string,
  defaultProtocol: ProxyProtocol,
  id: number,
): ParsedProxyEntry {
  const hasScheme = /^[a-z0-9+.-]+:\/\//i.test(raw);
  if (hasScheme) {
    try {
      const url = new URL(raw);
      const protocol = url.protocol.replace(/:$/, '').toLowerCase();
      if (!VALID_PROTOCOLS.has(protocol) || !url.hostname) {
        return {
          display: raw,
          id,
          parseError: 'Unsupported scheme or host',
          protocol,
          proxyUri: raw,
          raw,
        };
      }
      return {
        display: buildDisplayLabel(url, protocol),
        id,
        protocol,
        proxyUri: raw,
        raw,
      };
    } catch {
      return {
        display: raw,
        id,
        parseError: 'Invalid proxy URI',
        protocol: defaultProtocol,
        proxyUri: raw,
        raw,
      };
    }
  }

  let candidateUri: null | string = null;
  if (raw.includes('@')) {
    candidateUri = `${defaultProtocol}://${raw}`;
  } else {
    const parts = raw.split(':');
    if (parts.length === 2 && parts[0] && parts[1] && isValidPort(parts[1])) {
      candidateUri = `${defaultProtocol}://${parts[0]}:${parts[1]}`;
    } else if (
      parts.length >= 4 &&
      parts[0] &&
      parts[1] &&
      isValidPort(parts[1])
    ) {
      const user = encodeURIComponent(parts[2] ?? '');
      const pass = encodeURIComponent(parts.slice(3).join(':'));
      candidateUri = `${defaultProtocol}://${user}:${pass}@${parts[0]}:${parts[1]}`;
    }
  }

  if (!candidateUri) {
    return {
      display: raw,
      id,
      parseError: 'Expected URI, host:port, or host:port:user:pass',
      protocol: defaultProtocol,
      proxyUri: raw,
      raw,
    };
  }

  try {
    const url = new URL(candidateUri);
    return {
      display: buildDisplayLabel(url, defaultProtocol),
      id,
      protocol: defaultProtocol,
      proxyUri: candidateUri,
      raw,
    };
  } catch {
    return {
      display: raw,
      id,
      parseError: 'Invalid proxy host or port',
      protocol: defaultProtocol,
      proxyUri: raw,
      raw,
    };
  }
}

/**
 * Parses raw multi-line proxy input into deduplicated normalized probe targets.
 */
export function parseProxyLines(
  input: string,
  defaultProtocol: ProxyProtocol = 'http',
): ParsedProxyEntry[] {
  const seen = new Set<string>();
  const entries: ParsedProxyEntry[] = [];

  for (const line of input.split(/\r?\n/)) {
    const raw = line.trim();
    if (!raw || raw.startsWith('#') || seen.has(raw)) continue;
    seen.add(raw);
    entries.push(parseSingleProxyLine(raw, defaultProtocol, entries.length));
  }

  return entries;
}

export type ProbeProxyFn = (
  proxyUri: string,
  timeoutSecs: number,
  signal?: AbortSignal,
) => Promise<ProxyProbeResult>;

export interface BulkProxyCheckOptions {
  concurrency?: number;
  onUpdate: (items: BulkProxyCheckItem[]) => void;
  signal?: AbortSignal;
  timeoutSecs?: number;
}

/**
 * Checks parsed proxies concurrently via a bounded worker pool, streaming updates row by row.
 */
export async function runBulkProxyCheck(
  entries: ParsedProxyEntry[],
  probeFn: ProbeProxyFn,
  options: BulkProxyCheckOptions,
): Promise<BulkProxyCheckItem[]> {
  const timeoutSecs = Math.min(15, Math.max(1, options.timeoutSecs ?? 5));
  const concurrency = Math.min(16, Math.max(1, options.concurrency ?? 8));

  const items: BulkProxyCheckItem[] = entries.map((entry) =>
    entry.parseError
      ? { ...entry, error: entry.parseError, status: 'dead' }
      : { ...entry, status: 'pending' },
  );
  options.onUpdate([...items]);

  const queue = items
    .map((item, idx) => (item.status === 'pending' ? idx : -1))
    .filter((idx) => idx >= 0);

  let cursor = 0;
  async function worker() {
    while (cursor < queue.length && !options.signal?.aborted) {
      const idx = queue[cursor++];
      if (idx === undefined) break;
      const target = items[idx];
      if (!target) continue;

      items[idx] = { ...target, status: 'checking' };
      options.onUpdate([...items]);

      try {
        const res = await probeFn(target.proxyUri, timeoutSecs, options.signal);
        if (options.signal?.aborted) break;
        items[idx] = {
          ...target,
          colo: res.colo,
          country: res.country,
          egressIp: res.egressIp,
          error: res.error,
          rttMs: res.rttMs,
          status: res.alive ? 'alive' : 'dead',
        };
      } catch (error) {
        if (options.signal?.aborted) break;
        items[idx] = {
          ...target,
          error: error instanceof Error ? error.message : 'Proxy check failed',
          status: 'dead',
        };
      }
      options.onUpdate([...items]);
    }
  }

  const workerCount = Math.min(concurrency, queue.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return items;
}
