import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const dbState = {
  manifest: {},
  logs: {},
};
let bleInstance;
let lastManifestReader;
let lastDownloader;

vi.mock('@/device/ble', () => {
  class FakeBLE {
    constructor() {
      this.name = 'Perdix-X';
      this._disconnect = null;
      bleInstance = this;
    }
    async connect() {}
    onDisconnect(cb) {
      this._disconnect = cb;
    }
    triggerDisconnect() {
      this._disconnect?.();
    }
  }
  return {
    BLEShearwater: FakeBLE,
    checkBluetoothEnabled: vi.fn().mockResolvedValue(true),
  };
});

vi.mock('@/device/divemanifest', () => {
  class FakeManifestReader {
    constructor() {
      this._cb = () => {};
      lastManifestReader = this;
    }
    onProgress(cb) {
      this._cb = cb;
    }
    async read() {
      this._cb(0.5);
      this._cb(1);
      return [
        {
          id: 'dive-1',
          diveNo: 1,
          isSelected: false,
          isDownloaded: false,
          canDownload: true,
          diveDuration: 1000,
          recordAddressStart: new Uint8Array([0x80, 0, 0, 0]),
        },
        {
          id: 'dive-2',
          diveNo: 2,
          isSelected: false,
          isDownloaded: false,
          canDownload: true,
          diveDuration: 2000,
          recordAddressStart: new Uint8Array([0x80, 0, 0, 0]),
        },
      ];
    }
  }
  return { DiveManifestReader: FakeManifestReader };
});

vi.mock('@/device/divelogs', () => {
  class FakeDownloader {
    constructor() {
      this._subs = [];
      lastDownloader = this;
    }
    subscribe(cb) {
      this._subs.push(cb);
    }
    async download() {
      // emit one full opening + closing + a couple of samples + final
      this._fire({ log_type: 0x10, dive_number: 1 });
      this._fire({ log_type: 0x15, log_sample_rate_ms: 1000 });
      this._fire({ log_type: 0x01, depth: 50 });
      this._fire({ log_type: 0x01, depth: 60 });
      this._fire({ log_type: 0x20, dive_length: 60, dive_end: 0 });
      this._fire({ log_type: 0xff, product: 'Perdix' });
    }
    _fire(log) {
      for (const cb of this._subs) cb(log);
    }
  }
  class FakeDecoder {
    decode(x) {
      return x;
    }
  }
  function formatLogs() {
    return {
      openingData: {
        log_sample_rate_ms: 1000,
        depth_units: 0,
        temp_units: 2,
        deco_model: 0,
        battery_setting: 0,
        battery_type: 5,
        battery_voltage_x100: 380,
        battery_warning_level_x100: 350,
        battery_critical_level_x100: 300,
        battery_percent_remaining: 80,
        surface_time: 30,
        cns: 0,
        dive_start: 0,
        o2_status: 0,
        ppo2_low_x100: 50,
        ppo2_high_x100: 130,
        gas_0_oc_o2: 21,
        gas_1_oc_o2: 0,
        gas_2_oc_o2: 0,
        gas_3_oc_o2: 0,
        gas_4_oc_o2: 0,
        gas_0_cc_o2: 0,
        gas_1_cc_o2: 0,
        gas_2_cc_o2: 0,
        gas_3_cc_o2: 0,
        gas_4_cc_o2: 0,
        gas_0_oc_he: 0,
        gas_1_oc_he: 0,
        gas_2_oc_he: 0,
        gas_3_oc_he: 0,
        gas_4_oc_he: 0,
        gas_0_cc_he: 0,
        gas_1_cc_he: 0,
        gas_2_cc_he: 0,
        gas_3_cc_he: 0,
        gas_4_cc_he: 0,
        ccr_auto_sp_switch_up_lo_hi: 0,
        ccr_auto_sp_switch_up_hi_lo: 0,
        ccr_auto_sp_switch_up_depth: 0,
        ccr_auto_sp_switch_down_depth: 0,
        is_single_ppo2_sensor: 1,
        surface_pressure_mbars: 1013,
        serial_number: 'a',
        firmware_version: 0,
        vpm_b_conservatism: 0,
        salinity: 1000,
        dive_number: 1,
        gf_low: 30,
        gf_high: 70,
      },
      closingData: {
        dive_length: 60,
        dive_end: 0,
        max_depth_x10: 600,
        last_avg_sac_x100: 1000,
        total_on_time: 60,
        min_rct: 5,
        min_rst: 5,
        dive_time_with_min_rct: 1,
        dive_time_with_min_rst: 1,
        cns: 0,
        product: 'Perdix',
      },
      dive: {
        depth: [50, 60],
        sac: [100, 0xfff0],
        avg_ppo2: [70, 75],
        ai_t1_data: [0xfffa, 0x0500],
        ai_t2_data: [0x0100, 0xffff],
        water_temp: [25, 25],
        deco_ceiling: [0, 0],
        gf99: [10, 0xff],
        next_stop_or_ndl_time: [0, 0],
        next_stop_depth: [0, 0],
      },
    };
  }
  return { LogDownloader: FakeDownloader, LogDecoder: FakeDecoder, formatLogs };
});

vi.mock('@/db', () => ({
  loadManifest: vi.fn(async () => ({ ...dbState.manifest })),
  saveManifest: vi.fn(async (m) => {
    dbState.manifest = JSON.parse(JSON.stringify(m));
  }),
  saveDiveLog: vi.fn(async (d) => {
    dbState.logs[d.id] = d;
  }),
  fetchDiveLog: vi.fn(async (id) => dbState.logs[id]),
}));

import { useMainStore } from '@/store';

function flush() {
  return new Promise((r) => setTimeout(r, 0));
}

describe('main store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    dbState.manifest = {};
    dbState.logs = {};
    bleInstance = undefined;
    lastManifestReader = undefined;
    lastDownloader = undefined;
  });

  it('exposes computer name from the BLE adapter', async () => {
    const store = useMainStore();
    await flush();
    expect(store.computerName).toBe('Perdix-X');
  });

  it('connects, populates dives, and ignores already-downloaded entries on re-read', async () => {
    dbState.logs['dive-1'] = { id: 'dive-1' };
    dbState.manifest = {
      'dive-1': { id: 'dive-1', diveNo: 1, isSelected: false, isDownloaded: false, canDownload: false },
    };
    const store = useMainStore();
    await flush();
    // simulate manifest already showing dive-1 as downloaded
    store.dives['dive-1'].isDownloaded = true;
    await store.connect();
    expect(store.isConnected).toBe(true);
    expect(Object.keys(store.dives)).toContain('dive-1');
    expect(Object.keys(store.dives)).toContain('dive-2');
    // dive-1 stays "downloaded" because the connect path should not overwrite it
    expect(store.dives['dive-1'].isDownloaded).toBe(true);
  });

  it('toggleAllDiveCards selects all not-downloaded dives, then deselects', async () => {
    const store = useMainStore();
    await store.connect();
    store.toggleAllDiveCards();
    expect(store.selectedIds.length).toBe(2);
    expect(store.areAllDivesPicked).toBe(true);
    store.toggleAllDiveCards();
    expect(store.selectedIds.length).toBe(0);
    expect(store.areAllDivesPicked).toBe(false);
  });

  it('diveCardClicked toggles selection only when downloadable', async () => {
    const store = useMainStore();
    await store.connect();
    const d = store.dives['dive-1'];
    store.diveCardClicked(d);
    expect(d.isSelected).toBe(true);
    d.canDownload = false;
    d.isSelected = false;
    store.diveCardClicked(d);
    expect(d.isSelected).toBe(false);
  });

  it('disconnect callback flips canDownload on undownloaded dives', async () => {
    const store = useMainStore();
    await store.connect();
    expect(store.dives['dive-1'].canDownload).toBe(true);
    bleInstance.triggerDisconnect();
    expect(store.dives['dive-1'].canDownload).toBe(false);
    expect(store.isConnected).toBe(false);
  });

  it('downloadDives walks selected, marks dives as downloaded, and saves logs', async () => {
    const store = useMainStore();
    await store.connect();
    store.toggleAllDiveCards();
    expect(store.selectedIds.length).toBe(2);
    await store.downloadDives();
    expect(store.dives['dive-1'].isDownloaded).toBe(true);
    expect(store.dives['dive-2'].isDownloaded).toBe(true);
    expect(store.selectedIds.length).toBe(0);
    expect(dbState.logs['dive-1']).toBeDefined();
    expect(dbState.logs['dive-2']).toBeDefined();
    // wait the 500ms timeout that resets progress
    await new Promise((r) => setTimeout(r, 600));
    expect(store.progress).toBe(0);
  });

  it('getDiveDetails maps stored data into series, masks sentinels, applies visibility memory', async () => {
    const store = useMainStore();
    await store.connect();
    // pretend dive-1 was downloaded, populate stored log
    dbState.logs['dive-1'] = (await import('@/device/divelogs')).formatLogs();
    dbState.logs['dive-1'].id = 'dive-1';
    const detail = await store.getDiveDetails('dive-1');
    expect(detail.openingData.dive_number).toBe(1);
    expect(detail.times.length).toBeGreaterThan(0);
    const depthSeries = detail.series.find((s) => s.name === 'Depth');
    expect(depthSeries).toBeDefined();
    expect(depthSeries.isVisible).toBe(true);
    // toggling visibility persists across re-fetch
    store.toggleSeriesVisibility(depthSeries);
    expect(depthSeries.isVisible).toBe(false);
    const detail2 = await store.getDiveDetails('dive-1');
    const depth2 = detail2.series.find((s) => s.name === 'Depth');
    expect(depth2.isVisible).toBe(false);
  });
});
