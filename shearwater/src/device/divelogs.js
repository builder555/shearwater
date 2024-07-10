import { END_OF_FRAME } from "./constants";
import { slipDecode } from "./SLIP";

function areArraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

function getNum(data) {
    return data.reduce((acc, byte) => (acc << 8) | byte, 0);
}

function bytesToHex(data, delimiter = '') {
    return Array.from(data).map(byte => byte.toString(16).padStart(2, '0')).join(delimiter);
}

export class LogDecoder {
    constructor() {
        this._decoders = {
            0x10: this.decodeOpenRecord10.bind(this),
            0x11: this.decodeOpenRecord11.bind(this),
            0x12: this.decodeOpenRecord12.bind(this),
            0x13: this.decodeOpenRecord13.bind(this),
            0x14: this.decodeOpenRecord14.bind(this),
            0x15: this.decodeOpenRecord15.bind(this),
            0x16: this.decodeOpenRecord16.bind(this),
            0x17: this.decodeOpenRecord17.bind(this),
            0x01: this.decodeLogRecord.bind(this),
            0x20: this.decodeCloseRecord20.bind(this),
            0x21: this.decodeCloseRecord21.bind(this),
            0x22: this.decodeCloseRecord22.bind(this),
            0x23: this.decodeCloseRecord23.bind(this),
            0x24: this.decodeCloseRecord24.bind(this),
            0x25: this.decodeCloseRecord25.bind(this),
            0x26: this.decodeCloseRecord26.bind(this),
            0x27: this.decodeCloseRecord27.bind(this),
            0xFF: this.decodeFinalRecord.bind(this),
        };
    }

    decode(data) {
        const recordType = data[0];
        if (!(recordType in this._decoders)) {
            return bytesToHex(data);
        }
        return this._decoders[recordType](data);
    }

    decodeOpenRecord10(data) {
        return {
            dive_number: getNum(data.slice(2, 4)),
            gf_low: getNum(data.slice(4, 5)),
            gf_high: getNum(data.slice(5, 6)),
            tts: getNum(data.slice(6, 8)),
            depth_units: getNum(data.slice(8, 9)),
            battery_voltage_x10: getNum(data.slice(9, 10)),
            cns: getNum(data.slice(10, 12)),
            dive_start: getNum(data.slice(12, 16)),
            o2_status: getNum(data.slice(16, 17)),
            ppo2_low_x100: getNum(data.slice(17, 18)),
            ppo2_high_x100: getNum(data.slice(18, 19)),
            firmware_version: getNum(data.slice(19, 20)),
            gas_0_oc_o2: getNum(data.slice(20, 21)),
            gas_1_oc_o2: getNum(data.slice(21, 22)),
            gas_2_oc_o2: getNum(data.slice(22, 23)),
            gas_3_oc_o2: getNum(data.slice(23, 24)),
            gas_4_oc_o2: getNum(data.slice(24, 25)),
            gas_0_cc_o2: getNum(data.slice(25, 26)),
            gas_1_cc_o2: getNum(data.slice(26, 27)),
            gas_2_cc_o2: getNum(data.slice(27, 28)),
            gas_3_cc_o2: getNum(data.slice(28, 29)),
            gas_4_cc_o2: getNum(data.slice(29, 30)),
            gas_0_oc_he: getNum(data.slice(30, 31)),
            gas_1_oc_he: getNum(data.slice(31, 32)),
        };
    }

    decodeOpenRecord11(data) {
        return {
            gas_2_oc_he: getNum(data.slice(1, 2)),
            gas_3_oc_he: getNum(data.slice(2, 3)),
            gas_4_oc_he: getNum(data.slice(3, 4)),
            gas_0_cc_he: getNum(data.slice(4, 5)),
            gas_1_cc_he: getNum(data.slice(5, 6)),
            gas_2_cc_he: getNum(data.slice(6, 7)),
            gas_3_cc_he: getNum(data.slice(7, 8)),
            gas_4_cc_he: getNum(data.slice(8, 9)),
            ccr_auto_sp_switch_up_lo_hi: getNum(data.slice(9, 10)),
            ccr_auto_sp_switch_up_depth: getNum(data.slice(10, 11)),
            ccr_auto_sp_switch_up_hi_lo: getNum(data.slice(11, 12)),
            ccr_auto_sp_switch_down_depth: getNum(data.slice(12, 13)),
            is_single_ppo2_sensor: getNum(data.slice(13, 14)),
            gf_low: getNum(data.slice(14, 15)),
            gf_high: getNum(data.slice(15, 16)),
            surface_pressure_mbars: getNum(data.slice(16, 18)),
            serial_number: bytesToHex(data.slice(18, 22)),
        };
    }

    decodeOpenRecord12(data) {
        return {
            error_flags_0: getNum(data.slice(1, 5)),
            error_flags_1: getNum(data.slice(5, 9)),
            error_acks_0: getNum(data.slice(9, 13)),
            error_acks_1: getNum(data.slice(13, 17)),
            deco_model: getNum(data.slice(18, 19)),
            vpm_b_conservatism: getNum(data.slice(19, 20)),
            solenoid_depth_compensation: getNum(data.slice(20, 21)),
            oc_min_ppo2_x100: getNum(data.slice(21, 22)),
            oc_max_ppo2_x100: getNum(data.slice(22, 23)),
            oc_deco_ppo2_x100: getNum(data.slice(23, 24)),
            cc_min_ppo2_x100: getNum(data.slice(24, 25)),
            cc_max_ppo2_x100: getNum(data.slice(25, 26)),
            sensor_display: getNum(data.slice(26, 27)),
            last_stop_depth: getNum(data.slice(28, 29)),
            end_dive_delay: getNum(data.slice(29, 31)),
            clock_format: getNum(data.slice(31, 32)),
        };
    }

    decodeOpenRecord13(data) {
        return {
            title_color: getNum(data.slice(1, 2)),
            show_ppo2_in_oc_mode: getNum(data.slice(2, 3)),
            salinity: getNum(data.slice(3, 5)),
            gfs_value: getNum(data.slice(5, 6)),
            calibration_status: getNum(data.slice(6, 7)),
            sensor_1_calibration: getNum(data.slice(7, 9)),
            sensor_2_calibration: getNum(data.slice(9, 11)),
            sensor_3_calibration: getNum(data.slice(11, 13)),
            sensor_1_adc_offset: getNum(data.slice(13, 14)),
            sensor_2_adc_offset: getNum(data.slice(14, 15)),
            sensor_3_adc_offset: getNum(data.slice(15, 16)),
            rMS_temp_sticks_enabled: getNum(data.slice(16, 17)),
            rMS_warmup_flags: getNum(data.slice(17, 18)),
            rMS_ready_flags: getNum(data.slice(18, 19)),
            rMS_scrubber_rate: getNum(data.slice(19, 20)),
            current_RCT: getNum(data.slice(20, 22)),
            current_RST: getNum(data.slice(22, 24)),
        };
    }

    decodeOpenRecord14(data) {
        return {
            computer_mode: getNum(data.slice(1, 2)),
            revo2_co2_temp_gender: getNum(data.slice(2, 3)),
            co2_temp_weight: getNum(data.slice(3, 5)),
            battery_voltage_x100: getNum(data.slice(5, 7)),
            battery_gauge_available: getNum(data.slice(7, 8)),
            battery_percent_remain: getNum(data.slice(8, 9)),
            battery_type: getNum(data.slice(9, 10)),
            battery_setting: getNum(data.slice(10, 11)),
            battery_warning_level_x100: getNum(data.slice(11, 13)),
            battery_critical_level_x100: getNum(data.slice(13, 15)),
            log_version: getNum(data.slice(16, 17)),
            gas_states: getNum(data.slice(17, 19)),
            temp_units: getNum(data.slice(19, 20)),
            error_flags_2: getNum(data.slice(20, 24)),
            error_acks_2: getNum(data.slice(24, 28)),
            ai_mode: getNum(data.slice(28, 29)),
            gtr_mode: getNum(data.slice(29, 30)),
            ai_units: getNum(data.slice(30, 31)),
        };
    }

    decodeOpenRecord15(data) {
        const languages = [
            "English",
            "Chinese",
            "Japanese",
            "Korean",
            "Russian",
            "French",
            "German",
            "Spanish",
            "Italian",
            "Traditional Chinese",
            "Portuguese",
            "Polish",
        ];
        return {
            ai_t1_serial: bytesToHex(data.slice(1, 4)),
            ai_t1_max_psi: getNum(data.slice(6, 8)),
            ai_t1_reserve_psi: getNum(data.slice(8, 10)),
            ai_t2_serial: bytesToHex(data.slice(10, 13)),
            ai_t2_max_psi: getNum(data.slice(15, 17)),
            ai_t2_reserve_psi: getNum(data.slice(17, 19)),
            log_sample_rate_ms: getNum(data.slice(23, 25)),
            expected_log_sample_format: getNum(data.slice(25, 26)),
            timezone_offset: getNum(data.slice(26, 30)),
            dst: getNum(data.slice(30, 31)),
            language: languages[getNum(data.slice(31, 32))],
        };
    }

    decodeOpenRecord16(data) {
        return {
            total_stack_time: getNum(data.slice(1, 3)),
            remaining_stack_time: getNum(data.slice(3, 5)),
            sub_mode_oc_rec: getNum(data.slice(5, 6)),
            total_on_time: getNum(data.slice(6, 10)),
            depth_alert: getNum(data.slice(10, 13)),
            time_alert: getNum(data.slice(13, 16)),
            low_ndl_alert: getNum(data.slice(16, 19)),
            ai_t1_on: getNum(data.slice(19, 20)),
            ai_t1_name: bytesToHex(data.slice(20, 22)),
            ai_t2_on: getNum(data.slice(22, 23)),
            ai_t2_name: bytesToHex(data.slice(23, 25)),
            ai_t3_serial: bytesToHex(data.slice(25, 28)),
            ai_t3_max_psi: getNum(data.slice(28, 30)),
            ai_t3_reserve_psi: getNum(data.slice(30, 32)),
        };
    }

    decodeOpenRecord17(data) {
        return {
            ai_t3_on: getNum(data.slice(1, 2)),
            ai_t3_name: bytesToHex(data.slice(2, 4)),
            ai_t4_serial: bytesToHex(data.slice(4, 7)),
            ai_t4_max_psi: getNum(data.slice(7, 9)),
            ai_t4_reserve_psi: getNum(data.slice(9, 11)),
            ai_t4_on: getNum(data.slice(11, 12)),
            ai_t4_name: bytesToHex(data.slice(12, 14)),
            ai_sidemount_switch_psi: bytesToHex(data.slice(14, 16)),
            error_flags_3: getNum(data.slice(16, 20)),
            error_acks_3: getNum(data.slice(20, 24)),
            extended_dive_samples_in_log: getNum(data.slice(24, 25)),
        };
    }

    decodeCloseRecord20(data) {
        const decoded = this.decodeOpenRecord10(data);
        delete decoded.gf_low;
        delete decoded.gf_high;
        delete decoded.tts;
        delete decoded.depth_units;
        delete decoded.dive_start;
        decoded.max_depth_x10 = getNum(data.slice(4, 6));
        decoded.dive_length = getNum(data.slice(6, 9));
        decoded.dive_end = getNum(data.slice(12, 16));
        return decoded;
    }

    decodeCloseRecord21(data) {
        const decoded = this.decodeOpenRecord11(data);
        decoded.max_descent_rate = getNum(data.slice(22, 24));
        decoded.avg_descent_rate = getNum(data.slice(24, 26));
        decoded.max_ascent_rate = getNum(data.slice(26, 28));
        decoded.avg_ascent_rate = getNum(data.slice(28, 30));
        return decoded;
    }

    decodeCloseRecord22(data) {
        return this.decodeOpenRecord12(data);
    }

    decodeCloseRecord23(data) {
        const decoded = this.decodeOpenRecord13(data);
        decoded.min_rct = getNum(data.slice(24, 26));
        decoded.dive_time_with_min_rct = getNum(data.slice(26, 28));
        decoded.min_rst = getNum(data.slice(28, 30));
        decoded.dive_time_with_min_rst = getNum(data.slice(30, 32));
        return decoded;
    }

    decodeCloseRecord24(data) {
        return this.decodeOpenRecord14(data);
    }

    decodeCloseRecord25(data) {
        const decoded = this.decodeOpenRecord15(data);
        decoded.last_avg_sac_x100 = getNum(data.slice(19, 23));
        return decoded;
    }

    decodeCloseRecord26(data) {
        return this.decodeOpenRecord16(data);
    }

    decodeCloseRecord27(data) {
        return this.decodeOpenRecord17(data);
    }

    decodeLogRecord(data) {
        return {
            depth: getNum(data.slice(1, 3)),
            next_stop_depth: getNum(data.slice(3, 5)),
            tts: getNum(data.slice(5, 7)),
            avg_ppo2: getNum(data.slice(7, 8)),
            o2_percent: getNum(data.slice(8, 9)),
            he_percent: getNum(data.slice(9, 10)),
            next_stop_or_ndl_time: getNum(data.slice(10, 11)),
            battery_percent_remaining: getNum(data.slice(11, 12)),
            statuses: getNum(data.slice(12, 13)),
            o2_sensor_1_mv: getNum(data.slice(13, 14)),
            water_temp: getNum(data.slice(14, 15)),
            o2_sensor_2_mv: getNum(data.slice(15, 16)),
            o2_sensor_3_mv: getNum(data.slice(16, 17)),
            battery_voltage_x100: getNum(data.slice(17, 19)),
            ppo2_setpoint: getNum(data.slice(19, 20)),
            ai_t2_data: getNum(data.slice(20, 22)),
            gtr: getNum(data.slice(22, 23)),
            cns: getNum(data.slice(23, 24)),
            deco_ceiling: getNum(data.slice(24, 25)),
            gf99: getNum(data.slice(25, 26)),
            at_plus_5: getNum(data.slice(26, 28)),
            ai_t1_data: getNum(data.slice(28, 30)),
            sac: getNum(data.slice(30, 32)),
        };
    }

    decodeFinalRecord(data) {
        const products = [
            "Pursuit",
            null,
            "Predator",
            "Petrel",
            "Nerd",
            "Perdix",
            "Perdix AI",
            "Nerd 2",
            "Teric",
            "Peregrine",
            "Petrel 3",
            "Perdix 2",
        ];
        return {
            serial_number: bytesToHex(data.slice(2, 6)),
            checksum: getNum(data.slice(9, 10)),
            firmware_version: getNum(data.slice(10, 11)),
            log_version: getNum(data.slice(12, 13)),
            product: products[getNum(data.slice(13, 14))],
        };
    }
}

function expandToRuns(binaryChunks) {
    let runs = new Uint8Array();
    for (let chunk of binaryChunks) {
        const determiner = chunk[0];
        const payload = parseInt(chunk.slice(1), 2);
        if (determiner === "1") {
            runs = Uint8Array.of(...runs, payload);
        } else {
            runs = Uint8Array.of(...runs, ...new Uint8Array(payload));
        }
    }
    return runs;
}

function packetsTo9bitBinChunks(data) {
    let binArray = Array.from(data, b => b.toString(2).padStart(8, '0'));
    let bitsString = binArray.join('');
    let chunks = [];
    for (let i = 0; i < bitsString.length; i += 9) {
        chunks.push(bitsString.slice(i, i + 9));
    }
    return chunks;
}

function xorBlocks(b1, b2) {
    const length = Math.min(b1.length, b2.length);
    const result = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        result[i] = b1[i] ^ b2[i];
    }
    return result;
}


export class LogDownloader {
    constructor(dev) {
        this._dev = dev;
        this._isAcked = false;
        this._accumulator = new Uint8Array();
        this._items = [];
        this._hasReachedEnd = false;
        this._isNewData = false;
        this._subscribers = [];
        this._runs = new Uint8Array();
        this._lastLog = new Uint8Array(32);
    }

    subscribe(callback) {
        this._subscribers.push(callback);
    }

    unsubscribe(callback) {
        this._subscribers = this._subscribers.filter(sub => sub !== callback);
    }

    _notifySubs(logs) {
        for (let callback of this._subscribers) {
            for (let log of logs) {
                callback(log);
            }
        }
    }

    async _sendData(data) {
        this._isNewData = false;
        // console.log('sending', bytesToHex(data, ' '));
        await this._dev.sendData(data);
    }

    async waitForNewData() {
        while (!this._isNewData) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    _extractLogs(packet) {
        let chunks = packetsTo9bitBinChunks(packet);
        this._runs = Uint8Array.of(...this._runs, ...expandToRuns(chunks));
        let logs = [];
        while (this._runs.length >= 32) {
            let encodedBlock = this._runs.slice(0, 32);
            this._runs = this._runs.slice(32);
            let logEntry = xorBlocks(encodedBlock, this._lastLog);
            this._lastLog = logEntry;
            logs.push(logEntry);
        }
        return logs;
    }

    _onData(data) {
        // console.log('received', bytesToHex(data));
        let isAck = data.toString(16).includes((new Uint8Array([0x01, 0xff, 0x04, 0x00, 0x75, 0x10, 0x92])).toString(16));
        if (isAck) {
            this._isAcked = true;
            this._isNewData = true;
            return;
        }
        let isLogDone = data.slice(-3).toString(16).includes(new Uint8Array([0x77, 0x00, END_OF_FRAME]).toString(16));
        if (isLogDone) {
            this._isNewData = true;
            return;
        }
        let headlessData = data.slice(2);
        this._accumulator = Uint8Array.of(...this._accumulator, ...headlessData);
        if (this._accumulator[this._accumulator.length - 1] === END_OF_FRAME) {
            this._isNewData = true;
            this._hasReachedEnd = this._hasReachedEnd || areArraysEqual(this._accumulator.slice(-9, -1), new Uint8Array(8));
            let decoded = slipDecode(this._accumulator.slice(6));
            let logs = this._extractLogs(decoded);
            this._accumulator = new Uint8Array();
            this._notifySubs(logs);
        }
    }

    async download(address) {
        this._dev.subscribe(this._onData.bind(this));
        this._hasReachedEnd = false;
        this._isAcked = false;
        await this._sendData(Uint8Array.of(0x35, 0x10, 0x34, 0x80, ...address.slice(1)));
        while (!this._isAcked) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        let blockNum = 1;
        while (!this._hasReachedEnd) {
            await this._sendData(Uint8Array.of(0x36, blockNum));
            await this.waitForNewData();
            blockNum += 1;
        }
        await this._sendData(Uint8Array.of(0x37));
        await this.waitForNewData();
        this._dev.unsubscribe(this._onData.bind(this));
    }
}