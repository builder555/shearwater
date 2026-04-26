import { describe, it, expect } from 'vitest';
import {
  mapRawOpeningToReadable,
  mapRawClosingToReadable,
} from '@/device/logformat';

describe('mapRawOpeningToReadable', () => {
  it('returns empty object for falsy input', () => {
    expect(mapRawOpeningToReadable(undefined)).toEqual({});
    expect(mapRawOpeningToReadable(null)).toEqual({});
  });

  it('formats imperial dive (depth_units=1) and surface_time saturated', () => {
    const raw = {
      depth_units: 1,
      temp_units: 3,
      deco_model: 0,
      battery_setting: 0,
      battery_type: 5,
      battery_voltage_x100: 380,
      battery_warning_level_x100: 350,
      battery_critical_level_x100: 300,
      battery_percent_remaining: 80,
      surface_time: 0xffff,
      cns: 12,
      dive_start: 1700000000,
      o2_status: 0b101,
      ppo2_low_x100: 18,
      ppo2_high_x100: 140,
      gas_0_oc_o2: 21,
      gas_1_oc_o2: 32,
      gas_2_oc_o2: 50,
      gas_3_oc_o2: 100,
      gas_4_oc_o2: 100,
      gas_0_cc_o2: 21,
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
      ccr_auto_sp_switch_up_lo_hi: 1,
      ccr_auto_sp_switch_up_hi_lo: 0,
      ccr_auto_sp_switch_up_depth: 30,
      ccr_auto_sp_switch_down_depth: 40,
      is_single_ppo2_sensor: 0,
      surface_pressure_mbars: 1013,
      serial_number: 'deadbeef',
      firmware_version: 0x10,
      vpm_b_conservatism: 2,
      salinity: 1000,
      dive_number: 42,
      gf_low: 35,
      gf_high: 75,
    };
    const out = mapRawOpeningToReadable(raw);
    expect(out.depth_units).toBe('ft');
    expect(out.surface_time).toBe('45d+');
    expect(out.cns).toBe('12%');
    expect(out.o2_status).toEqual({ 1: 'yes', 2: 'no', 3: 'yes' });
    expect(out.ppo2_low).toBe('0.18 ATA');
    expect(out.ppo2_high).toBe('1.4 ATA');
    expect(out.gas_0_oc_o2).toBe('21%');
    expect(out.ccr_auto_sp_switch_up_lo_hi).toBe('auto');
    expect(out.ccr_auto_sp_switch_up_hi_lo).toBe('manual');
    expect(out.ccr_auto_sp_switch_up_depth).toBe('30ft');
    expect(out.ccr_auto_sp_switch_down_depth).toBe('40ft');
    expect(out.is_single_ppo2_sensor).toBe('no');
    expect(out.surface_pressure).toBe('1.013 bar');
    expect(out.deco_model).toBe('GF');
    expect(out.water_type).toBe('fresh');
    expect(out.battery_voltage).toBe('3.8V');
    expect(out.battery_percentage).toBe('80%');
    expect(out.battery_warning_level).toBe('3.5V');
    expect(out.battery_critical_level).toBe('3V');
    expect(out.battery_type).toBe('3.7V Li-Ion (auto-detected)');
    expect(out.temp_units).toBe('F');
    expect(out.temp_units_configured).toBe('F');
  });

  it('formats metric dive with non-saturated surface_time and explicit battery setting', () => {
    const raw = {
      depth_units: 0,
      temp_units: 2,
      deco_model: 1,
      battery_setting: 5,
      battery_type: 5,
      battery_voltage_x100: 380,
      battery_warning_level_x100: 350,
      battery_critical_level_x100: 300,
      battery_percent_remaining: 50,
      surface_time: 90,
      cns: 0,
      dive_start: 0,
      o2_status: 0,
      ppo2_low_x100: 50,
      ppo2_high_x100: 130,
      gas_0_oc_o2: 21, gas_1_oc_o2: 0, gas_2_oc_o2: 0, gas_3_oc_o2: 0, gas_4_oc_o2: 0,
      gas_0_cc_o2: 0, gas_1_cc_o2: 0, gas_2_cc_o2: 0, gas_3_cc_o2: 0, gas_4_cc_o2: 0,
      gas_0_oc_he: 0, gas_1_oc_he: 0, gas_2_oc_he: 0, gas_3_oc_he: 0, gas_4_oc_he: 0,
      gas_0_cc_he: 0, gas_1_cc_he: 0, gas_2_cc_he: 0, gas_3_cc_he: 0, gas_4_cc_he: 0,
      ccr_auto_sp_switch_up_lo_hi: 0,
      ccr_auto_sp_switch_up_hi_lo: 1,
      ccr_auto_sp_switch_up_depth: 0,
      ccr_auto_sp_switch_down_depth: 0,
      is_single_ppo2_sensor: 1,
      surface_pressure_mbars: 1013,
      serial_number: 'abc',
      firmware_version: 0,
      vpm_b_conservatism: 0,
      salinity: 1024,
      dive_number: 1,
      gf_low: 0,
      gf_high: 0,
    };
    const out = mapRawOpeningToReadable(raw);
    expect(out.depth_units).toBe('m');
    expect(out.surface_time).toBe('0d 1h 30m');
    expect(out.deco_model).toBe('VPM-B');
    expect(out.is_single_ppo2_sensor).toBe('yes');
    expect(out.ccr_auto_sp_switch_up_lo_hi).toBe('manual');
    expect(out.ccr_auto_sp_switch_up_hi_lo).toBe('auto');
    expect(out.water_type).toBe('EN13319');
    expect(out.battery_type).toBe('3.7V Li-Ion');
    expect(out.temp_units).toBe('C');
    expect(out.temp_units_configured).toBe('C');
  });

  it('classifies salt water', () => {
    const raw = baseOpening({ salinity: 1030, depth_units: 0 });
    expect(mapRawOpeningToReadable(raw).water_type).toBe('salt');
  });
});

function baseOpening(overrides = {}) {
  return {
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
    gas_0_oc_o2: 21, gas_1_oc_o2: 0, gas_2_oc_o2: 0, gas_3_oc_o2: 0, gas_4_oc_o2: 0,
    gas_0_cc_o2: 0, gas_1_cc_o2: 0, gas_2_cc_o2: 0, gas_3_cc_o2: 0, gas_4_cc_o2: 0,
    gas_0_oc_he: 0, gas_1_oc_he: 0, gas_2_oc_he: 0, gas_3_oc_he: 0, gas_4_oc_he: 0,
    gas_0_cc_he: 0, gas_1_cc_he: 0, gas_2_cc_he: 0, gas_3_cc_he: 0, gas_4_cc_he: 0,
    ccr_auto_sp_switch_up_lo_hi: 0,
    ccr_auto_sp_switch_up_hi_lo: 0,
    ccr_auto_sp_switch_up_depth: 0,
    ccr_auto_sp_switch_down_depth: 0,
    is_single_ppo2_sensor: 0,
    surface_pressure_mbars: 1013,
    serial_number: 'a',
    firmware_version: 0,
    vpm_b_conservatism: 0,
    salinity: 1000,
    dive_number: 1,
    gf_low: 30,
    gf_high: 70,
    ...overrides,
  };
}

describe('mapRawClosingToReadable', () => {
  it('returns empty object on falsy input', () => {
    expect(mapRawClosingToReadable(undefined)).toEqual({});
    expect(mapRawClosingToReadable(null)).toEqual({});
  });

  it('maps closing record fields with derived units', () => {
    const out = mapRawClosingToReadable({
      avg_ascent_rate: 800,
      avg_descent_rate: 1000,
      max_depth_x10: 350,
      max_ascent_rate: 1500,
      max_descent_rate: 2000,
      last_avg_sac_x100: 1234,
      product: 'Perdix',
      dive_end: 1700000600,
      dive_length: 600,
      dive_time_with_min_rct: 60,
      dive_time_with_min_rst: 120,
      min_rct: 5,
      min_rst: 7,
      total_on_time: 600,
      cns: 12,
    });
    expect(out.max_depth).toBe(35);
    expect(out.last_sac).toBeCloseTo(12.34, 2);
    expect(out.dive_length_fmt).toBe('0h 10m 0s');
    expect(out.min_rct).toBe('0h 5m 0s');
    expect(out.min_rst).toBe('0h 7m 0s');
    expect(out.cns).toBe('12%');
    expect(out.product).toBe('Perdix');
    expect(out.checksum).toBe(111);
  });
});
