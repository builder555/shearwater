import { describe, it, expect, beforeEach } from 'vitest';
import { loadManifest, saveManifest, saveDiveLog, fetchDiveLog } from '@/db';

describe('db (localStorage-backed)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loadManifest returns empty object when nothing stored', async () => {
    const out = await loadManifest();
    expect(out).toEqual({});
  });

  it('saves and loads manifest, marking downloaded entries', async () => {
    const manifest = {
      a: { id: 'a' },
      b: { id: 'b' },
    };
    await saveManifest(manifest);
    await saveDiveLog({ id: 'a', logs: [1, 2] });

    const loaded = await loadManifest();
    expect(loaded.a.isDownloaded).toBe(true);
    expect(loaded.a.canDownload).toBe(false);
    expect(loaded.b.isDownloaded).toBe(false);
    expect(loaded.b.canDownload).toBe(false);
  });

  it('fetchDiveLog returns the stored dive payload', async () => {
    await saveDiveLog({ id: 'x', dive: [1, 2, 3] });
    const dive = await fetchDiveLog('x');
    expect(dive).toEqual({ id: 'x', dive: [1, 2, 3] });
  });

  it('fetchDiveLog returns null for missing id', async () => {
    expect(await fetchDiveLog('missing')).toBeNull();
  });
});
