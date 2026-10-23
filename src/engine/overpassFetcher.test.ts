import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Fresh module per test so the remembered server doesn't leak between tests
let fetchPistes: typeof import('./overpassFetcher').fetchPistes;
beforeEach(async () => {
  vi.resetModules();
  ({ fetchPistes } = await import('./overpassFetcher'));
});

const bbox = { south: 45.93, west: 7.62, north: 45.95, east: 7.65 };
const ok = () => new Response(JSON.stringify({ elements: [] }), { status: 200 });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Overpass server fallback', () => {
  it('falls back to the next server when the main one refuses, then prefers it', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.startsWith('https://overpass-api.de') ? new Response('', { status: 406 }) : ok(),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchPistes(bbox);
    expect(fetchMock.mock.calls.map((c) => new URL(c[0]).host)).toEqual(['overpass-api.de', 'maps.mail.ru']);

    fetchMock.mockClear();
    await fetchPistes(bbox);
    expect(fetchMock.mock.calls.map((c) => new URL(c[0]).host)).toEqual(['maps.mail.ru']);
  });

  it('retries a mirror once after a busy reply', async () => {
    vi.useFakeTimers();
    let mirrorCalls = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.startsWith('https://overpass-api.de')) return new Response('', { status: 406 });
      return ++mirrorCalls === 1 ? new Response('', { status: 504 }) : ok();
    }));
    const p = fetchPistes(bbox);
    await vi.runAllTimersAsync();
    await expect(p).resolves.toEqual([]);
    expect(mirrorCalls).toBe(2);
  });

  it('moves on when a server returns a partial reply with a warning', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.startsWith('https://overpass-api.de')
        ? new Response(JSON.stringify({ elements: [], remark: 'runtime error: Query timed out' }), { status: 200 })
        : ok(),
    );
    vi.stubGlobal('fetch', fetchMock);
    await fetchPistes(bbox);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports a clear error when every server fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(fetchPistes(bbox)).rejects.toThrow(/Could not reach any map data server/);
  });
});
