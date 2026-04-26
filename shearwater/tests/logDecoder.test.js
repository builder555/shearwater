import { describe, it, expect, beforeEach } from 'vitest';
import { LogDecoder, formatLogs, bytesToHex } from '@/device/divelogs';

function buf(values, size = 32) {
  const out = new Uint8Array(size);
  for (const [offset, val] of Object.entries(values)) {
    const i = Number(offset);
    if (Array.isArray(val)) {
      out.set(val, i);
    } else if (val instanceof Uint8Array) {
      out.set(val, i);
    } else {
      out[i] = val;
    }
  }
  return out;
}

function be(...bytes) {
  return bytes.reduce((acc, b) => (acc << 8) | b, 0);
}

describe('bytesToHex', () => {
  it('encodes bytes as zero-padded hex string', () => {
    expect(bytesToHex(new Uint8Array([0x00, 0x0f, 0xff]))).toBe('000fff');
  });
  it('uses delimiter when provided', () => {
    expect(bytesToHex(new Uint8Array([0xab, 0xcd]), ':')).toBe('ab:cd');
  });
});

describe('LogDecoder.decode dispatch', () => {
  let dec;
  beforeEach(() => {
    dec = new LogDecoder();
  });

  it('returns hex string for unknown record types', () => {
    const data = new Uint8Array([0x99, 0x01, 0x02]);
    expect(dec.decode(data)).toBe('990102');
  });

  it('attaches log_type to decoded objects', () => {
    const data = buf({ 0: 0x10, 2: [0x00, 0x05] });
    const out = dec.decode(data);
    expect(out.log_type).toBe(0x10);
    expect(out.dive_number).toBe(5);
  });
});

describe('LogDecoder open records', () => {
  let dec;
  beforeEach(() => {
    dec = new LogDecoder();
  });

  it('decodes record 0x10 fields', () => {
    const data = buf({
      0: 0x10,
      2: [0x01, 0x2c],
      4: 0x14,
      5: 0x55,
      6: [0x00, 0x3c],
      8: 0x00,
      9: 0x36,
      10: [0x00, 0x0a],
      12: [0x66, 0x53, 0x14, 0xce],
      16: 0x05,
      17: 0x12,
      18: 0x44,
      19: 0x4d,
      20: 21,
      21: 32,
      22: 0,
      23: 0,
      24: 0,
      25: 99,
      26: 0,
      27: 0,
      28: 0,
      29: 0,
      30: 0,
      31: 0,
    });
    const out = dec.decodeOpenRecord10(data);
    expect(out.dive_number).toBe(be(0x01, 0x2c));
    expect(out.gf_low).toBe(0x14);
    expect(out.gf_high).toBe(0x55);
    expect(out.surface_time).toBe(0x3c);
    expect(out.battery_voltage_x10).toBe(0x36);
    expect(out.cns).toBe(0x0a);
    expect(out.dive_start).toBe(be(0x66, 0x53, 0x14, 0xce));
    expect(out.o2_status).toBe(0x05);
    expect(out.ppo2_low_x100).toBe(0x12);
    expect(out.ppo2_high_x100).toBe(0x44);
    expect(out.firmware_version).toBe(0x4d);
    expect(out.gas_0_oc_o2).toBe(21);
    expect(out.gas_1_oc_o2).toBe(32);
    expect(out.gas_0_cc_o2).toBe(99);
  });

  it('decodes record 0x11 fields', () => {
    const data = buf({
      0: 0x11,
      9: 1,
      11: 1,
      13: 1,
      14: 0x21,
      15: 0x55,
      16: [0x03, 0xed],
      18: [0xde, 0xad, 0xbe, 0xef],
    });
    const out = dec.decodeOpenRecord11(data);
    expect(out.ccr_auto_sp_switch_up_lo_hi).toBe(1);
    expect(out.ccr_auto_sp_switch_up_hi_lo).toBe(1);
    expect(out.is_single_ppo2_sensor).toBe(1);
    expect(out.gf_low).toBe(0x21);
    expect(out.gf_high).toBe(0x55);
    expect(out.surface_pressure_mbars).toBe(be(0x03, 0xed));
    expect(out.serial_number).toBe('deadbeef');
  });

  it('decodes record 0x12 fields', () => {
    const data = buf({
      0: 0x12,
      1: [0, 0, 0, 0xff],
      5: [0, 0, 0, 0x10],
      9: [0, 0, 0, 0x20],
      13: [0, 0, 0, 0x40],
      18: 1,
      19: 2,
      20: 0,
      21: 50,
      22: 140,
      23: 160,
      24: 70,
      25: 132,
      26: 0,
      28: 6,
      29: [0, 0xa],
      31: 1,
    });
    const out = dec.decodeOpenRecord12(data);
    expect(out.error_flags_0).toBe(0xff);
    expect(out.error_flags_1).toBe(0x10);
    expect(out.error_acks_0).toBe(0x20);
    expect(out.error_acks_1).toBe(0x40);
    expect(out.deco_model).toBe(1);
    expect(out.vpm_b_conservatism).toBe(2);
    expect(out.oc_min_ppo2_x100).toBe(50);
    expect(out.oc_max_ppo2_x100).toBe(140);
    expect(out.oc_deco_ppo2_x100).toBe(160);
    expect(out.cc_min_ppo2_x100).toBe(70);
    expect(out.cc_max_ppo2_x100).toBe(132);
    expect(out.last_stop_depth).toBe(6);
    expect(out.end_dive_delay).toBe(0x0a);
    expect(out.clock_format).toBe(1);
  });

  it('decodes record 0x13 fields', () => {
    const data = buf({
      0: 0x13,
      1: 4,
      2: 1,
      3: [0x03, 0xfd],
      5: 50,
      6: 0b101,
      7: [0x01, 0x02],
      9: [0x01, 0x03],
      11: [0x01, 0x04],
      13: 5,
      14: 6,
      15: 7,
      16: 1,
      17: 2,
      18: 3,
      19: 5,
      20: [0x00, 0x10],
      22: [0x00, 0x20],
    });
    const out = dec.decodeOpenRecord13(data);
    expect(out.title_color).toBe(4);
    expect(out.show_ppo2_in_oc_mode).toBe(1);
    expect(out.salinity).toBe(0x03fd);
    expect(out.gfs_value).toBe(50);
    expect(out.calibration_status).toBe(0b101);
    expect(out.sensor_1_calibration).toBe(0x0102);
    expect(out.sensor_2_calibration).toBe(0x0103);
    expect(out.sensor_3_calibration).toBe(0x0104);
    expect(out.sensor_1_adc_offset).toBe(5);
    expect(out.sensor_2_adc_offset).toBe(6);
    expect(out.sensor_3_adc_offset).toBe(7);
    expect(out.rMS_temp_sticks_enabled).toBe(1);
    expect(out.rMS_warmup_flags).toBe(2);
    expect(out.rMS_ready_flags).toBe(3);
    expect(out.rMS_scrubber_rate).toBe(5);
    expect(out.current_RCT).toBe(0x10);
    expect(out.current_RST).toBe(0x20);
  });

  it('decodes record 0x14 fields', () => {
    const data = buf({
      0: 0x14,
      1: 1,
      2: 0,
      3: [0, 0],
      5: [0x01, 0x9c],
      7: 1,
      8: 80,
      9: 5,
      10: 0,
      11: [0x01, 0x12],
      13: [0x00, 0xfa],
      16: 14,
      17: [0x00, 0x07],
      19: 2,
      20: [0, 0, 0, 0],
      24: [0, 0, 0, 0],
      28: 3,
      29: 1,
      30: 1,
    });
    const out = dec.decodeOpenRecord14(data);
    expect(out.computer_mode).toBe(1);
    expect(out.battery_voltage_x100).toBe(0x019c);
    expect(out.battery_gauge_available).toBe(1);
    expect(out.battery_percent_remaining).toBe(80);
    expect(out.battery_type).toBe(5);
    expect(out.battery_setting).toBe(0);
    expect(out.battery_warning_level_x100).toBe(0x0112);
    expect(out.battery_critical_level_x100).toBe(0x00fa);
    expect(out.log_version).toBe(14);
    expect(out.gas_states).toBe(0x07);
    expect(out.temp_units).toBe(2);
    expect(out.ai_mode).toBe(3);
    expect(out.gtr_mode).toBe(1);
    expect(out.ai_units).toBe(1);
  });

  it('decodes record 0x15 fields including language string', () => {
    const data = buf({
      0: 0x15,
      1: [0xab, 0xcd, 0xef],
      6: [0x0b, 0xb8],
      8: [0x01, 0xf4],
      10: [0x12, 0x34, 0x56],
      15: [0x0c, 0xe4],
      17: [0x01, 0x2c],
      23: [0x03, 0xe8],
      25: 1,
      26: [0, 0, 0, 0xff],
      30: 1,
      31: 5, // French
    });
    const out = dec.decodeOpenRecord15(data);
    expect(out.ai_t1_serial).toBe('abcdef');
    expect(out.ai_t1_max_psi).toBe(0x0bb8);
    expect(out.ai_t1_reserve_psi).toBe(0x01f4);
    expect(out.ai_t2_serial).toBe('123456');
    expect(out.ai_t2_max_psi).toBe(0x0ce4);
    expect(out.ai_t2_reserve_psi).toBe(0x012c);
    expect(out.log_sample_rate_ms).toBe(1000);
    expect(out.expected_log_sample_format).toBe(1);
    expect(out.timezone_offset).toBe(0xff);
    expect(out.dst).toBe(1);
    expect(out.language).toBe('French');
  });

  it('decodes record 0x16 (transmitter names as ASCII)', () => {
    const data = buf({
      0: 0x16,
      1: [0x00, 0x10],
      3: [0x00, 0x05],
      5: 1,
      6: [0, 0, 0, 0xff],
      10: [1, 0x01, 0x90],
      13: [1, 0x00, 0x14],
      16: [1, 0x00, 0x05],
      19: 1,
      20: [0x54, 0x31], // "T1"
      22: 1,
      23: [0x54, 0x32], // "T2"
      25: [0xaa, 0xbb, 0xcc],
      28: [0x0b, 0xb8],
      30: [0x01, 0xf4],
    });
    const out = dec.decodeOpenRecord16(data);
    expect(out.total_stack_time).toBe(0x10);
    expect(out.remaining_stack_time).toBe(0x05);
    expect(out.sub_mode_oc_rec).toBe(1);
    expect(out.total_on_time).toBe(0xff);
    expect(out.ai_t1_on).toBe(1);
    expect(out.ai_t1_name).toBe('T1');
    expect(out.ai_t2_on).toBe(1);
    expect(out.ai_t2_name).toBe('T2');
    expect(out.ai_t3_serial).toBe('aabbcc');
    expect(out.ai_t3_max_psi).toBe(0x0bb8);
    expect(out.ai_t3_reserve_psi).toBe(0x01f4);
  });

  it('decodes record 0x17', () => {
    const data = buf({
      0: 0x17,
      1: 1,
      2: [0x54, 0x33], // "T3"
      4: [0xde, 0xad, 0xbe],
      7: [0x0b, 0xb8],
      9: [0x01, 0xf4],
      11: 1,
      12: [0x54, 0x34], // "T4"
      14: [0x12, 0x34],
      16: [0, 0, 0, 0xee],
      20: [0, 0, 0, 0xff],
      24: 0xe1,
    });
    const out = dec.decodeOpenRecord17(data);
    expect(out.ai_t3_on).toBe(1);
    expect(out.ai_t3_name).toBe('T3');
    expect(out.ai_t4_serial).toBe('deadbe');
    expect(out.ai_t4_max_psi).toBe(0x0bb8);
    expect(out.ai_t4_reserve_psi).toBe(0x01f4);
    expect(out.ai_t4_on).toBe(1);
    expect(out.ai_t4_name).toBe('T4');
    expect(out.ai_sidemount_switch_psi).toBe('1234');
    expect(out.error_flags_3).toBe(0xee);
    expect(out.error_acks_3).toBe(0xff);
    expect(out.extended_dive_samples_in_log).toBe(0xe1);
  });
});

describe('LogDecoder log record (0x01)', () => {
  it('decodes a normal sample', () => {
    const dec = new LogDecoder();
    const data = buf({
      0: 0x01,
      1: [0x00, 0x55],
      3: [0x00, 0x00],
      5: [0x00, 0x05],
      7: 0x40,
      8: 21,
      9: 0,
      10: 30,
      11: 80,
      12: 0,
      13: 50,
      14: 25,
      15: 50,
      16: 50,
      17: [0x01, 0x90],
      19: 70,
      20: [0x10, 0x00],
      22: 12,
      23: 5,
      24: 0,
      25: 30,
      26: [0x00, 0x55],
      28: [0x10, 0x00],
      30: [0x00, 0xc8],
    });
    const out = dec.decodeLogRecord(data);
    expect(out.depth).toBe(0x55);
    expect(out.next_stop_or_ndl_time).toBe(30);
    expect(out.water_temp).toBe(25);
    expect(out.battery_voltage_x100).toBe(0x190);
    expect(out.ai_t1_data).toBe(0x1000);
    expect(out.ai_t2_data).toBe(0x1000);
    expect(out.gtr).toBe(12);
    expect(out.cns).toBe(5);
    expect(out.gf99).toBe(30);
    expect(out.sac).toBe(0xc8);
  });
});

describe('LogDecoder close records', () => {
  let dec;
  beforeEach(() => {
    dec = new LogDecoder();
  });

  it('decodes 0x20 (drops opening-only fields, adds close fields)', () => {
    const data = buf({
      0: 0x20,
      4: [0x01, 0x2c],
      6: [0, 0x05, 0xdc],
      12: [0x66, 0x53, 0x40, 0x00],
    });
    const out = dec.decodeCloseRecord20(data);
    expect(out.max_depth_x10).toBe(0x012c);
    expect(out.dive_length).toBe(0x05dc);
    expect(out.dive_end).toBe(be(0x66, 0x53, 0x40, 0x00));
    expect(out.gf_low).toBeUndefined();
    expect(out.gf_high).toBeUndefined();
    expect(out.depth_units).toBeUndefined();
    expect(out.dive_start).toBeUndefined();
  });

  it('decodes 0x21 (rates added)', () => {
    const data = buf({
      0: 0x21,
      22: [0x01, 0x90],
      24: [0x00, 0xc8],
      26: [0x02, 0x58],
      28: [0x00, 0xfa],
    });
    const out = dec.decodeCloseRecord21(data);
    expect(out.max_descent_rate).toBe(0x0190);
    expect(out.avg_descent_rate).toBe(0x00c8);
    expect(out.max_ascent_rate).toBe(0x0258);
    expect(out.avg_ascent_rate).toBe(0x00fa);
  });

  it('decodes 0x22 as alias of open 12', () => {
    const data = buf({ 0: 0x22, 18: 2 });
    const out = dec.decodeCloseRecord22(data);
    expect(out.deco_model).toBe(2);
  });

  it('decodes 0x23 (rct/rst added)', () => {
    const data = buf({
      0: 0x23,
      24: [0x00, 0x10],
      26: [0x00, 0x20],
      28: [0x00, 0x30],
      30: [0x00, 0x40],
    });
    const out = dec.decodeCloseRecord23(data);
    expect(out.min_rct).toBe(0x10);
    expect(out.dive_time_with_min_rct).toBe(0x20);
    expect(out.min_rst).toBe(0x30);
    expect(out.dive_time_with_min_rst).toBe(0x40);
  });

  it('decodes 0x24 alias of open 14', () => {
    const data = buf({ 0: 0x24, 1: 2 });
    expect(dec.decodeCloseRecord24(data).computer_mode).toBe(2);
  });

  it('decodes 0x25 (last_avg_sac added)', () => {
    const data = buf({ 0: 0x25, 19: [0x00, 0x00, 0x09, 0xc4] });
    const out = dec.decodeCloseRecord25(data);
    expect(out.last_avg_sac_x100).toBe(0x09c4);
  });

  it('decodes 0x26 alias of open 16', () => {
    const data = buf({ 0: 0x26, 19: 1 });
    expect(dec.decodeCloseRecord26(data).ai_t1_on).toBe(1);
  });

  it('decodes 0x27 alias of open 17', () => {
    const data = buf({ 0: 0x27, 1: 1 });
    expect(dec.decodeCloseRecord27(data).ai_t3_on).toBe(1);
  });

  it('routes log_type 0x20-0x27 and 0xff via decode()', () => {
    const types = [0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0xff];
    for (const t of types) {
      const data = buf({ 0: t });
      const out = dec.decode(data);
      expect(out.log_type).toBe(t);
    }
  });

  it('decodes final record 0xff', () => {
    const data = buf({
      0: 0xff,
      2: [0x12, 0x34, 0x56, 0x78],
      9: 0x42,
      10: 0x10,
      12: 14,
      13: 5, // Perdix
    });
    const out = dec.decodeFinalRecord(data);
    expect(out.serial_number).toBe('12345678');
    expect(out.checksum).toBe(0x42);
    expect(out.firmware_version).toBe(0x10);
    expect(out.log_version).toBe(14);
    expect(out.product).toBe('Perdix');
  });
});

describe('formatLogs', () => {
  it('separates opening, closing, and dive samples', () => {
    const logs = [
      { log_type: 0x10, dive_number: 1 },
      { log_type: 0x11, gf_low: 30 },
      { log_type: 0x01, depth: 100, sac: 200 },
      { log_type: 0x01, depth: 110, sac: 210 },
      { log_type: 0x20, dive_length: 5000 },
      { log_type: 0xff, product: 'Perdix' },
    ];
    const result = formatLogs(logs);
    expect(result.openingData.dive_number).toBe(1);
    expect(result.openingData.gf_low).toBe(30);
    expect(result.openingData.log_type).toBeUndefined();
    expect(result.closingData.dive_length).toBe(5000);
    expect(result.closingData.product).toBe('Perdix');
    expect(result.closingData.log_type).toBeUndefined();
    expect(result.dive.depth).toEqual([100, 110]);
    expect(result.dive.sac).toEqual([200, 210]);
  });

  it('fills missing fields with null', () => {
    const logs = [{ log_type: 0x01, depth: 50 }];
    const result = formatLogs(logs);
    expect(result.dive.depth).toEqual([50]);
    expect(result.dive.water_temp).toEqual([null]);
  });

  it('handles empty logs array', () => {
    const result = formatLogs([]);
    expect(result.openingData).toEqual({});
    expect(result.closingData).toEqual({});
    expect(result.dive.depth).toEqual([]);
  });
});
