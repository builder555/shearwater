import { describe, it, expect, vi } from 'vitest';
import { LogDownloader } from '@/device/divelogs';

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

const ACK = new Uint8Array([0x01, 0xff, 0x04, 0x00, 0x75, 0x10, 0x92, 0xc0]);
const LOG_DONE = new Uint8Array([0x77, 0x00, 0xc0]);

// Encoded payload that decompresses to a 32-byte block whose first byte is 0xff
// (final-record marker), satisfying _gotFinalRecord and emptying _runs.
// Pre-SLIP bytes: [0xff, 0x87, 0xc0]; SLIP-escaped: [0xff, 0x87, 0xdb, 0xdc].
const FINAL_BLOCK_PACKET = new Uint8Array([
  0x03, 0x00,
  0x01, 0xff, 0x93, 0x00, 0x76, 0x01,
  0xff, 0x87, 0xdb, 0xdc,
  0xc0,
]);

describe('LogDownloader', () => {
  it('downloads, surfaces a final record to subscribers, and sends termination byte', async () => {
    const dev = new FakeDev([ACK, FINAL_BLOCK_PACKET, LOG_DONE]);
    const dl = new LogDownloader(dev);
    const cb = vi.fn();
    dl.subscribe(cb);
    await dl.download(new Uint8Array([0x80, 0x07, 0x9e, 0x20]));
    expect(cb).toHaveBeenCalled();
    const log = cb.mock.calls[0][0];
    expect(log[0]).toBe(0xff);
    for (let i = 1; i < 32; i++) expect(log[i]).toBe(0);
    expect(dev.calls[0]).toEqual([0x35, 0x10, 0x34, 0x80, 0x07, 0x9e, 0x20]);
    expect(dev.calls[dev.calls.length - 1]).toEqual([0x37]);
  });

  it('unsubscribe removes a previously registered callback', () => {
    const dl = new LogDownloader(new FakeDev([]));
    const cb = vi.fn();
    dl.subscribe(cb);
    dl.unsubscribe(cb);
    expect(dl._subscribers).not.toContain(cb);
  });

  it('ack packet sets _isAcked', () => {
    const dl = new LogDownloader(new FakeDev([]));
    dl._onData(ACK);
    expect(dl._isAcked).toBe(true);
  });

  it('log-done packet sets _isLogDone', () => {
    const dl = new LogDownloader(new FakeDev([]));
    dl._onData(LOG_DONE);
    expect(dl._isLogDone).toBe(true);
  });

  it('non-ack non-log-done packet that does not end with 0xc0 leaves state unchanged', () => {
    const dl = new LogDownloader(new FakeDev([]));
    dl._onData(new Uint8Array([0x03, 0x00, 0x42, 0x01, 0x02]));
    expect(dl._isAcked).toBe(false);
    expect(dl._isLogDone).toBe(false);
  });

});
