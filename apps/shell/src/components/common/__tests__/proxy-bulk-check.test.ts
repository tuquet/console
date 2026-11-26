// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

import { parseProxyLines, runBulkProxyCheck } from '../proxy-bulk-check';

describe('proxy-bulk-check', () => {
  it('parses URI, host:port, host:port:user:pass, ignores comments, and flags invalid rows', () => {
    const entries = parseProxyLines(
      [
        '# comment line',
        'socks5://alice:secret@127.0.0.1:1080',
        '10.0.0.1:8080',
        '10.0.0.2:9000:bob:pa:ss',
        '10.0.0.1:8080',
        'not-a-proxy',
      ].join('\n'),
      'http',
    );

    expect(entries).toHaveLength(4);
    expect(entries[0]).toMatchObject({
      display: 'socks5://127.0.0.1:1080',
      protocol: 'socks5',
      proxyUri: 'socks5://alice:secret@127.0.0.1:1080',
    });
    expect(entries[1]).toMatchObject({
      display: 'http://10.0.0.1:8080',
      protocol: 'http',
      proxyUri: 'http://10.0.0.1:8080',
    });
    expect(entries[2]).toMatchObject({
      display: 'http://10.0.0.2:9000',
      proxyUri: 'http://bob:pa%3Ass@10.0.0.2:9000',
    });
    expect(entries[3]?.parseError).toBeTruthy();
  });

  it('probes valid entries concurrently and marks failures / abort cleanly', async () => {
    const entries = parseProxyLines(
      '10.0.0.1:8080\n10.0.0.2:8080\nbad-line',
      'http',
    );
    const probe = vi.fn(async (proxyUri: string) => {
      if (proxyUri.includes('10.0.0.1')) {
        return {
          alive: true,
          colo: 'SIN',
          country: 'SG',
          egressIp: '1.1.1.1',
          protocol: 'http',
          proxyUrl: proxyUri,
          rttMs: 42,
        };
      }
      throw new Error('timeout');
    });

    const snapshots: number[] = [];
    const results = await runBulkProxyCheck(entries, probe, {
      concurrency: 2,
      onUpdate: (items) => {
        snapshots.push(items.filter((i) => i.status === 'alive').length);
      },
      timeoutSecs: 5,
    });

    expect(probe).toHaveBeenCalledTimes(2);
    expect(results[0]).toMatchObject({
      egressIp: '1.1.1.1',
      rttMs: 42,
      status: 'alive',
    });
    expect(results[1]).toMatchObject({ error: 'timeout', status: 'dead' });
    expect(results[2]).toMatchObject({ status: 'dead' });
    expect(snapshots.at(-1)).toBe(1);
  });
});
