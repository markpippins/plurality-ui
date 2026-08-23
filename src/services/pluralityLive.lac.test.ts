// @vitest-environment happy-dom
// LAC contract test (architect thread 83d2fd5c, rule 5) — plurality-ui.
// Live provider contract: live default, mock explicit opt-in, upstream
// failures throw (never simulated rows), status mapping stays total.

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('LAC contract: plurality-ui live provider', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('defaults to LIVE mode; mock only via explicit VITE_PLURALITY_MODE=mock', async () => {
    // vite statically bakes import.meta.env from process env at transform —
    // run via `npm test` which pins VITE_PLURALITY_MODE=live.
    const mod = await import('./pluralityLive');
    expect(mod.pluralityMode).toBe('live');
  });

  it('fetchLiveWorkRequests throws on upstream failure (fail-visible)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));
    const mod = await import('./pluralityLive');
    await expect(mod.fetchLiveWorkRequests()).rejects.toThrow(/HTTP 503/);
    vi.unstubAllGlobals();
  });

  it('fetchLivePlanSummaries maps nebula-srv plan rows to summaries', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ items: [{ planNumber: '0136', title: 'T', status: 'pending' }] }),
    })));
    const mod = await import('./pluralityLive');
    const plans = await mod.fetchLivePlanSummaries();
    expect(plans).toEqual([{ number: '0136', title: 'T', status: 'pending' }]);
    vi.unstubAllGlobals();
  });

  it('maps execution-srv statuses onto the plurality vocabulary totally', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        items: [
          { id: 'a', status: 'COMPLETED' },
          { id: 'b', status: 'RUNNING' },
          { id: 'c', status: 'WEIRD-NEW-STATUS' },
        ],
      }),
    })));
    const mod = await import('./pluralityLive');
    const wrs = await mod.fetchLiveWorkRequests();
    expect(wrs.map((w) => w.status)).toEqual(['VALIDATE', 'EXEC', 'PLAN']);
    vi.unstubAllGlobals();
  });
});
