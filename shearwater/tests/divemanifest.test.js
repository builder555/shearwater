import { describe, it, expect, vi } from 'vitest';
import { DiveManifestReader } from '@/device/divemanifest';

class FakeDev {
  constructor(responses) {
    this._cb = null;
    this._responses = [...responses];
    this.calls = [];
  }
  subscribe(cb) {
    this._cb = cb;
  }
  unsubscribe() {
    this._cb = null;
  }
  async sendData(data) {
    this.calls.push(Array.from(data));
    const next = this._responses.shift();
    if (next && this._cb) {
      Promise.resolve().then(() => this._cb(next));
    }
  }
}

const ACK = new Uint8Array([0x01, 0xff, 0x04, 0x00, 0x75, 0x10, 0x82, 0xc0]);

function emptyBlock() {
  // raw packet: 2-byte header + frame-prefix + END_OF_FRAME
  return new Uint8Array([0x03, 0x00, 0x01, 0xff, 0x93, 0x00, 0x76, 0x01, 0xc0]);
}

function blockWithManifest(manifestBytes) {
  // raw packet: header(2) + frame-prefix(6) + manifest(32) + END_OF_FRAME
  return new Uint8Array([
    0x03, 0x00,
    0x01, 0xff, 0x93, 0x00, 0x76, 0x01,
    ...manifestBytes,
    0xc0,
  ]);
}

describe('DiveManifestReader', () => {
  it('reads 12 blocks, decodes a manifest entry, and reports progress', async () => {
    const manifest = new Uint8Array([
      0xa5, 0xc4,
      0x00, 0x05,
      0x66, 0x53, 0x14, 0xce,
      0x66, 0x53, 0x40, 0x00,
      0x00, 0x00, 0x05, 0xdc,
      0x00, 0x66,
      0x00, 0x32,
      0x80, 0x07, 0x9e, 0x20,
      0x80, 0x07, 0xb1, 0x40,
      0x00,
      0x00,
      0x01,
      0x01,
    ]);
    const responses = [
      ACK,
      blockWithManifest(manifest),
      ...Array.from({ length: 11 }, () => emptyBlock()),
    ];
    const dev = new FakeDev(responses);
    const reader = new DiveManifestReader(dev);
    const progress = vi.fn();
    reader.onProgress(progress);
    const out = await reader.read();
    expect(out).toHaveLength(1);
    const dive = out[0];
    expect(dive.diveNo).toBe(5);
    expect(dive.code).toBe('a5c4');
    expect(dive.computerMode).toBe('OC Tec');
    expect(dive.depthUnits).toBe('meters');
    expect(dive.diveDuration).toBe(0x05dc);
    expect(dive.maxDepth).toBe(10.2);
    expect(dive.avgDepth).toBe(5);
    expect(dive.id).toBe('80079e20-8007b140');
    expect(dive.manifestVersion).toBe(1);
    expect(dive.startDateFmt).toMatch(/2024/);
    expect(progress).toHaveBeenCalledWith(1 / 12);
    expect(progress).toHaveBeenCalledWith(1);
    expect(dev.calls[dev.calls.length - 1]).toEqual([0x37]);
  });

  it('throws on packet with wrong header bytes', async () => {
    const reader = new DiveManifestReader(new FakeDev([]));
    reader._accumulator = new Uint8Array([0x99, 0x00, 0x93, 0x00, 0x76, 0x01, 0xc0]);
    expect(() => reader.decodeManifests()).toThrow(/Invalid packet/);
  });

  it('detects end-of-data marker (sequence of zero bytes)', async () => {
    const responses = [
      ACK,
      ...Array.from({ length: 12 }, () =>
        new Uint8Array([
          0x03, 0x00,
          0x01, 0xff, 0x93, 0x00, 0x76, 0x01,
          0, 0, 0, 0, 0, 0, 0, 0,
          0xc0,
        ]),
      ),
    ];
    const reader = new DiveManifestReader(new FakeDev(responses));
    await reader.read();
    expect(reader._hasReachedEnd).toBe(true);
  });
});
