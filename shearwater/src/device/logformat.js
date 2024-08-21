import { getDate, getHhMmSs, getDaysHhMm } from './date.functions';

export function mapRawOpeningToReadable(dive) {
  if (!dive) return {};

  function getWaterType(density) {
    if (density < 1005) return 'fresh';
    if (density < 1025) return 'EN13319';
    if (density < 1045) return 'salt';
  }
  const depth_units = ['m', 'ft'][dive.depth_units];
  const deco_model = ['GF', 'VPM-B', 'VPMB-B/GFS', 'DCIEM'][dive.deco_model];
  const battery_type = ['', '1.5V Alkaline', '1.5V Lithium', '1.2VV NiMH', '3.6V Saft', '3.7V Li-Ion'][
    dive.battery_type
  ];
  const temp_units_configured = { 2: 'C', 3: 'F' }[dive.temp_units];
  // shearwater returns temperature in C for metric depth units and in F for imperial
  const temp_units = ['C', 'F'][dive.depth_units];

  const mapped = {
    ...dive,
    dive_number: dive.dive_number,
    gf_low: dive.gf_low,
    gf_high: dive.gf_high,
    surface_time: dive.surface_time == 0xFFFF ? '45d+' : getDaysHhMm(dive.surface_time),
    depth_units: depth_units,
    cns: `${dive.cns}%`,
    dive_start: getDate(dive.dive_start),
    o2_status: {
      1: dive.o2_status & 0b001 ? 'yes' : 'no',
      2: dive.o2_status & 0b010 ? 'yes' : 'no',
      3: dive.o2_status & 0b100 ? 'yes' : 'no',
    },
    ppo2_low: `${dive.ppo2_low_x100 / 100} ATA`,
    ppo2_high: `${dive.ppo2_high_x100 / 100} ATA`,
    firmware_version: dive.firmware_version,
    gas_0_oc_o2: `${dive.gas_0_oc_o2}%`,
    gas_0_cc_o2: `${dive.gas_0_cc_o2}%`,
    gas_1_oc_o2: `${dive.gas_1_oc_o2}%`,
    gas_1_cc_o2: `${dive.gas_1_cc_o2}%`,
    gas_2_oc_o2: `${dive.gas_2_oc_o2}%`,
    gas_2_cc_o2: `${dive.gas_2_cc_o2}%`,
    gas_3_oc_o2: `${dive.gas_3_oc_o2}%`,
    gas_3_cc_o2: `${dive.gas_3_cc_o2}%`,
    gas_4_oc_o2: `${dive.gas_4_oc_o2}%`,
    gas_4_cc_o2: `${dive.gas_4_cc_o2}%`,
    gas_0_oc_he: `${dive.gas_0_oc_he}%`,
    gas_0_cc_he: `${dive.gas_0_cc_he}%`,
    gas_1_oc_he: `${dive.gas_1_oc_he}%`,
    gas_1_cc_he: `${dive.gas_1_cc_he}%`,
    gas_2_oc_he: `${dive.gas_2_oc_he}%`,
    gas_2_cc_he: `${dive.gas_2_cc_he}%`,
    gas_3_oc_he: `${dive.gas_3_oc_he}%`,
    gas_3_cc_he: `${dive.gas_3_cc_he}%`,
    gas_4_oc_he: `${dive.gas_4_oc_he}%`,
    gas_4_cc_he: `${dive.gas_4_cc_he}%`,
    ccr_auto_sp_switch_up_lo_hi: dive.ccr_auto_sp_switch_up_lo_hi ? 'auto' : 'manual',
    ccr_auto_sp_switch_up_hi_lo: dive.ccr_auto_sp_switch_up_hi_lo ? 'auto' : 'manual',
    ccr_auto_sp_switch_up_depth: `${dive.ccr_auto_sp_switch_up_depth}${depth_units}`,
    ccr_auto_sp_switch_down_depth: `${dive.ccr_auto_sp_switch_down_depth}${depth_units}`,
    is_single_ppo2_sensor: dive.is_single_ppo2_sensor ? 'yes' : 'no',
    surface_pressure: `${dive.surface_pressure_mbars / 1000} bar`,
    serial_number: dive.serial_number,
    deco_model,
    vpm_b_conservatism: dive.vpm_b_conservatism,
    water_type: getWaterType(dive.salinity),
    battery_type,
    temp_units,
    temp_units_configured,
  };
  return mapped;
}
export function mapRawClosingToReadable(dive) {
  if (!dive) return {};
  const mapped = {
    avg_ascent_rate: dive.avg_ascent_rate, //mbar/min
    avg_descent_rate: dive.avg_descent_rate, //mbar/min
    max_depth_x10: dive.max_depth_x10,
    max_ascent_rate: dive.max_ascent_rate, //mbar/min
    max_descent_rate: dive.max_descent_rate, //mbar/min
    last_avg_sac_x100: dive.last_avg_sac_x100,
    product: dive.product,
    checksum: 111,
    dive_end: getDate(dive.dive_end),
    dive_length: getHhMmSs(dive.dive_length),
    dive_time_with_min_rct: getHhMmSs(dive.dive_time_with_min_rct), //minutes
    dive_time_with_min_rst: getHhMmSs(dive.dive_time_with_min_rst), //minutes
    last_sac: dive.last_avg_sac_x100 / 100,
    max_depth: dive.max_depth_x10 / 10,
    min_rct: getHhMmSs(dive.min_rct * 60), // minutes
    min_rst: getHhMmSs(dive.min_rst * 60), // minutes
    total_on_time: getDaysHhMm(dive.total_on_time / 60),
    cns: `${dive.cns}%`,
  };
  return mapped;
}
