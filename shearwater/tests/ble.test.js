import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BLEShearwater, checkBluetoothEnabled } from '@/device/ble';

function makeFakeBluetooth({ available = true } = {}) {
  const listeners = {};
  const fakeChar = {
    startNotifications: vi.fn().mockResolvedValue(),
    addEventListener: vi.fn((evt, cb) => {
      listeners[evt] = cb;
    }),
    removeEventListener: vi.fn(),
    writeValue: vi.fn().mockResolvedValue(),
    _fire(evt, value) {
      listeners[evt]?.({ target: { value: { buffer: value.buffer } } });
    },
  };
  const fakeService = {
    getCharacteristic: vi.fn().mockResolvedValue(fakeChar),
  };
  const fakeServer = {
    connected: true,
    getPrimaryService: vi.fn().mockResolvedValue(fakeService),
    disconnect: vi.fn().mockResolvedValue(),
  };
  const deviceListeners = {};
  const fakeDevice = {
    name: 'Perdix-1234',
    gatt: { connected: true, connect: vi.fn().mockResolvedValue(fakeServer) },
    addEventListener: vi.fn((evt, cb) => {
      deviceListeners[evt] = cb;
    }),
    _fire(evt) {
      deviceListeners[evt]?.();
    },
  };
  const bluetooth = {
    requestDevice: vi.fn().mockResolvedValue(fakeDevice),
    getAvailability: vi.fn().mockResolvedValue(available),
  };
  return { bluetooth, fakeDevice, fakeServer, fakeChar };
}

describe('checkBluetoothEnabled', () => {
  it('returns availability when navigator.bluetooth exists', async () => {
    const { bluetooth } = makeFakeBluetooth();
    Object.defineProperty(globalThis.navigator, 'bluetooth', {
      configurable: true,
      value: bluetooth,
    });
    await expect(checkBluetoothEnabled()).resolves.toBe(true);
  });

  it('returns undefined when navigator.bluetooth missing', async () => {
    Object.defineProperty(globalThis.navigator, 'bluetooth', {
      configurable: true,
      value: undefined,
    });
    await expect(checkBluetoothEnabled()).resolves.toBeUndefined();
  });
});

describe('BLEShearwater', () => {
  let stubs;
  beforeEach(() => {
    stubs = makeFakeBluetooth();
    Object.defineProperty(globalThis.navigator, 'bluetooth', {
      configurable: true,
      value: stubs.bluetooth,
    });
  });

  it('connect() wires up device, service, characteristic and stores name', async () => {
    const ble = new BLEShearwater();
    await ble.connect();
    expect(stubs.bluetooth.requestDevice).toHaveBeenCalled();
    expect(stubs.fakeServer.getPrimaryService).toHaveBeenCalled();
    expect(stubs.fakeChar.startNotifications).toHaveBeenCalled();
    expect(ble.name).toBe('Perdix-1234');
  });

  it('subscribe receives data from characteristicvaluechanged events', async () => {
    const ble = new BLEShearwater();
    await ble.connect();
    const cb = vi.fn();
    ble.subscribe(cb);
    stubs.fakeChar._fire('characteristicvaluechanged', new Uint8Array([1, 2, 3]));
    expect(cb).toHaveBeenCalledOnce();
    const arg = cb.mock.calls[0][0];
    expect(Array.from(arg)).toEqual([1, 2, 3]);
  });

  it('does not throw when no subscriber and data arrives', async () => {
    const ble = new BLEShearwater();
    await ble.connect();
    expect(() =>
      stubs.fakeChar._fire('characteristicvaluechanged', new Uint8Array([1])),
    ).not.toThrow();
  });

  it('subscribing a second callback replaces the first', async () => {
    const ble = new BLEShearwater();
    await ble.connect();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    ble.subscribe(cb1);
    ble.subscribe(cb2);
    stubs.fakeChar._fire('characteristicvaluechanged', new Uint8Array([0xab]));
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it('disconnect handler clears name and fires user callback', async () => {
    const ble = new BLEShearwater();
    await ble.connect();
    const onDisc = vi.fn();
    ble.onDisconnect(onDisc);
    stubs.fakeDevice._fire('gattserverdisconnected');
    expect(onDisc).toHaveBeenCalled();
    expect(ble.name).toBe('');
  });

  it('disconnect handler tolerates missing user callback', async () => {
    const ble = new BLEShearwater();
    await ble.connect();
    expect(() => stubs.fakeDevice._fire('gattserverdisconnected')).not.toThrow();
  });

  it('sendData prepends framing bytes and slip-encodes the buffer', async () => {
    const ble = new BLEShearwater();
    await ble.connect();
    await ble.sendData(new Uint8Array([0x35, 0x00]));
    expect(stubs.fakeChar.writeValue).toHaveBeenCalled();
    const sent = stubs.fakeChar.writeValue.mock.calls[0][0];
    expect(sent[0]).toBe(0x01);
    expect(sent[1]).toBe(0x00);
    expect(sent[2]).toBe(0xff);
    expect(sent[3]).toBe(0x01);
    expect(sent[sent.length - 1]).toBe(0xc0);
  });

  it('disconnect() writes shutdown payload and closes server', async () => {
    const ble = new BLEShearwater();
    await ble.connect();
    await ble.disconnect();
    expect(stubs.fakeChar.writeValue).toHaveBeenCalled();
    expect(stubs.fakeServer.disconnect).toHaveBeenCalled();
  });

  it('unsubscribe does not throw', async () => {
    const ble = new BLEShearwater();
    await ble.connect();
    expect(() => ble.unsubscribe()).not.toThrow();
  });
});
