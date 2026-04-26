import { describe, it, expect } from 'vitest';
import { slipEncode, slipDecode } from '@/device/SLIP';
import { END_OF_FRAME, ESC_CODE, ESC_END, ESC_ESC } from '@/device/constants';

describe('slipEncode', () => {
  it('appends end-of-frame to plain bytes', () => {
    const out = slipEncode(new Uint8Array([0x01, 0x02, 0x03]));
    expect(Array.from(out)).toEqual([0x01, 0x02, 0x03, END_OF_FRAME]);
  });

  it('escapes END_OF_FRAME byte inside payload', () => {
    const out = slipEncode(new Uint8Array([0x01, END_OF_FRAME, 0x02]));
    expect(Array.from(out)).toEqual([0x01, ESC_CODE, ESC_END, 0x02, END_OF_FRAME]);
  });

  it('escapes ESC_CODE byte inside payload', () => {
    const out = slipEncode(new Uint8Array([0x01, ESC_CODE, 0x02]));
    expect(Array.from(out)).toEqual([0x01, ESC_CODE, ESC_ESC, 0x02, END_OF_FRAME]);
  });

  it('handles empty input', () => {
    const out = slipEncode(new Uint8Array([]));
    expect(Array.from(out)).toEqual([END_OF_FRAME]);
  });

  it('returns Uint8Array', () => {
    expect(slipEncode(new Uint8Array([0x01]))).toBeInstanceOf(Uint8Array);
  });
});

describe('slipDecode', () => {
  it('returns null on null input', () => {
    expect(slipDecode(null)).toBeNull();
  });

  it('returns null on empty input', () => {
    expect(slipDecode(new Uint8Array([]))).toBeNull();
  });

  it('decodes payload terminated by END_OF_FRAME', () => {
    const out = slipDecode(new Uint8Array([0x01, 0x02, 0x03, END_OF_FRAME]));
    expect(Array.from(out)).toEqual([0x01, 0x02, 0x03]);
  });

  it('decodes ESC_END escape sequence to END_OF_FRAME byte', () => {
    const out = slipDecode(new Uint8Array([0x01, ESC_CODE, ESC_END, 0x02, END_OF_FRAME]));
    expect(Array.from(out)).toEqual([0x01, END_OF_FRAME, 0x02]);
  });

  it('decodes ESC_ESC escape sequence to ESC_CODE byte', () => {
    const out = slipDecode(new Uint8Array([0x01, ESC_CODE, ESC_ESC, 0x02, END_OF_FRAME]));
    expect(Array.from(out)).toEqual([0x01, ESC_CODE, 0x02]);
  });

  it('treats unknown escape byte as literal', () => {
    const out = slipDecode(new Uint8Array([0x01, ESC_CODE, 0x42, 0x02, END_OF_FRAME]));
    expect(Array.from(out)).toEqual([0x01, 0x42, 0x02]);
  });

  it('returns null when no END_OF_FRAME is present', () => {
    expect(slipDecode(new Uint8Array([0x01, 0x02, 0x03]))).toBeNull();
  });

  it('skips leading END_OF_FRAME (treated as boundary, no payload yet)', () => {
    const out = slipDecode(new Uint8Array([END_OF_FRAME, 0x01, 0x02, END_OF_FRAME]));
    expect(Array.from(out)).toEqual([0x01, 0x02]);
  });

  it('handles ESC_CODE at end of buffer (no follow byte)', () => {
    const out = slipDecode(new Uint8Array([0x01, ESC_CODE]));
    expect(out).toBeNull();
  });
});

describe('round trip', () => {
  it('encode then decode returns original payload', () => {
    const original = new Uint8Array([0x00, 0x01, END_OF_FRAME, ESC_CODE, 0xff, 0x42]);
    const decoded = slipDecode(slipEncode(original));
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });
});
