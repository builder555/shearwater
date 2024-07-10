from bleak import BleakClient, BleakScanner
from bleak.backends.characteristic import BleakGATTCharacteristic
from bleak.backends.device import BLEDevice
import asyncio
import datetime
import json
from typing import Callable

END_OF_FRAME = 0xC0
ESC_CODE = 0xDB
ESC_END = 0xDC
ESC_ESC = 0xDD
SERVICE_UUID = "FE25C237-0ECE-443C-B0AA-E02033E7029D"
CHARACTERISTIC_UUID = "27B7570B-359E-45A3-91BB-CF7E70049BD2"


def slip_decode(data: bytes):
    if data is None or len(data) < 1:
        raise Exception("No data")

    decoded_data = bytearray(len(data))
    decoded_data_index = 0
    i = 0
    while i < len(data):
        if data[i] == END_OF_FRAME:
            if decoded_data_index > 0:
                # Resize the decoded data to its exact length
                return bytes(decoded_data[:decoded_data_index])
        elif data[i] == ESC_CODE:
            i += 1
            if i < len(data):
                if data[i] == ESC_END:
                    decoded_data[decoded_data_index] = 0xC0
                elif data[i] == ESC_ESC:
                    decoded_data[decoded_data_index] = 0xDB
                else:
                    decoded_data[decoded_data_index] = data[i]
                decoded_data_index += 1
        else:
            decoded_data[decoded_data_index] = data[i]
            decoded_data_index += 1
        i += 1
    raise Exception("Invalid data")


def slip_encode(data):
    encoded = bytearray()
    for byte in data:
        if byte == END_OF_FRAME:
            encoded += bytes([ESC_CODE, ESC_END])
        elif byte == ESC_CODE:
            encoded += bytes([ESC_CODE, ESC_ESC])
        else:
            encoded.append(byte)
    encoded.append(END_OF_FRAME)
    return encoded


class DeviceNotFound(Exception):
    pass


class DeviceNotConnected(Exception):
    pass


class BLEShearwater:
    def __init__(self):
        self._queue = bytearray()
        self._accumulator = bytearray()
        self._client: BleakClient | None = None
        self._callbacks = []

    def subscribe(self, callback: Callable):
        if callback in self._callbacks:
            return
        self._callbacks.append(callback)

    def unsubscribe(self, callback: Callable):
        self._callbacks.remove(callback)

    async def __scan_ble(self, name: str) -> BLEDevice:
        devices = await BleakScanner.discover()
        for d in devices:
            if d.name and "perdix" in d.name.lower():
                print(f"perdix found: {d}")
                return d
        else:
            raise DeviceNotFound

    async def connect(self):
        print("connecting..", end="", flush=True)
        while True:
            try:
                print(".", end="", flush=True)
                target_device = await self.__scan_ble("perdix")
                break
            except DeviceNotFound:
                await asyncio.sleep(1)
        self._client = BleakClient(target_device)
        await self._client.connect()
        await self._client.start_notify(CHARACTERISTIC_UUID, self.got_new_data)

    def got_new_data(self, sender: BleakGATTCharacteristic, data: bytearray):
        for callback in self._callbacks:
            callback(data)

    async def send_data(self, data: bytes):
        if self._client is None:
            raise DeviceNotConnected
        prepend = bytes([0x01, 0x00, 0xFF, 0x01, len(data) + 1, 0x00])
        encoded = slip_encode(prepend + data)
        print("sending: ", encoded.hex(sep=" "))
        await self._client.write_gatt_char(CHARACTERISTIC_UUID, encoded)

    async def close_connection(self):
        if self._client is None:
            raise DeviceNotConnected
        await self._client.stop_notify(CHARACTERISTIC_UUID)
        await self.send_data(bytes([0x2E, 0x90, 0x20, 0x00]))
        await self._client.disconnect()


def get_num(data: bytes):
    return int.from_bytes(data, byteorder="big")


depth_units = {
    0: "meters",
    1: "feet",
}


def decode_manifest(data: bytes):

    def get_date(timestamp: int):
        # shearwater does not have a concept of timezones, so it shows as UTC
        return datetime.datetime.fromtimestamp(
            timestamp, tz=datetime.timezone.utc
        ).strftime("%Y-%m-%d %H:%M:%S")

    def get_hh_mm_ss(timestamp: int):
        return datetime.datetime.fromtimestamp(
            timestamp, tz=datetime.timezone.utc
        ).strftime("%Hh %Mm %Ss")

    computer_mode = {
        0: "CC/BO",
        1: "OC Tec",
        2: "Gauge",
        3: "PPO2 Display",
        4: "SC/BO",
        5: "CC/BO 2",
        6: "OC Rec",
        7: "Freedive",
    }
    dive = {
        "code": data[0:2].hex(),
        "dive_no": get_num(data[2:4]),
        "dive_start": get_date(get_num(data[4:8])),
        "dive_end": get_date(get_num(data[8:12])),
        "dive_duration": get_hh_mm_ss(get_num(data[12:16])),
        "max_depth_x10": get_num(data[16:18]),
        "avg_depth_x10": get_num(data[18:20]),
        "record_address_start": data[20:24].hex(),
        "record_address_end": data[24:28].hex(),
        "depth_units": depth_units[get_num(data[28:29])],
        "temp_units": get_num(data[29:30]),  # ignore
        "computer_mode": computer_mode[get_num(data[30:31])],
        "manifest_version": get_num(
            data[31:32]
        ),  # 0 - original, 1 - adds dive computer mode
    }
    return dive


class Manifest:
    def __init__(self, dev: BLEShearwater):
        self._dev = dev
        self._is_acked = False
        self._accumulator = bytearray()
        self._items = []
        self._is_new_data = False

    async def _send_data(self, data: bytes):
        self._is_new_data = False
        await self._dev.send_data(data)

    async def wait_for_new_data(self):
        while not self._is_new_data:
            await asyncio.sleep(0.1)

    def _on_data(self, data: bytes):
        print(f"received data: {data.hex()}")
        is_manifest_ack = bytes.fromhex("01ff0400751082") in data
        if is_manifest_ack:
            self._is_acked = True
            self._is_new_data = True
            return
        headless_data = data[2:]
        self._accumulator += headless_data
        if self._accumulator[-1] == END_OF_FRAME:
            self._is_new_data = True
            self.decode_manifests()
            self._accumulator = bytearray()

    def decode_manifests(self):
        def extract_manifests(data: bytes) -> list[bytes]:
            payload = data[6:]
            manifests = [payload[i : i + 32] for i in range(0, len(payload), 32)]
            return [m for m in manifests if m[0] == 0xA5 and m[1] == 0xC4]

        data = self._accumulator
        is_packet_ok = data[0:2] == bytes([0x01, 0xFF]) and data[3:4] == bytes([0x00])
        if not is_packet_ok:
            raise Exception(f"Invalid packet: {data.hex()}")
        decoded = slip_decode(data)
        if not decoded:
            raise Exception(f"Failed to decode: {data.hex()}")
        manifests = extract_manifests(decoded)
        for manifest in manifests:
            self._items.append(decode_manifest(manifest))

    async def read(self):
        self._dev.subscribe(self._on_data)
        max_blocks = 12
        await self._send_data(bytes([0x35, 0x00, 0x34, 0xE0, 0x00, 0x00, 0x00]))
        while not self._is_acked:
            await asyncio.sleep(0.1)
        block_num = 1
        while block_num <= max_blocks:
            await self._send_data(bytes([0x36, block_num]))
            await self.wait_for_new_data()
            block_num += 1
        await self._send_data(bytes([0x37]))
        await asyncio.sleep(1)
        self._dev.unsubscribe(self._on_data)


class LogDownloader:
    def __init__(self, dev: BLEShearwater):
        self._dev = dev
        self._is_acked = False
        self._accumulator = bytearray()
        self._items = []
        self._has_reached_end = False
        self._is_new_data = False
        self._subscribers = []
        self.__runs = bytearray()
        self.__last_log = bytes([0] * 32)

    def subscribe(self, callback: Callable):
        self._subscribers.append(callback)

    def unsubscribe(self, callback: Callable):
        self._subscribers.remove(callback)

    def __notify_subs(self, logs: list[bytes]):
        for callback in self._subscribers:
            for log in logs:
                callback(log)

    async def _send_data(self, data: bytes):
        self._is_new_data = False
        await self._dev.send_data(data)

    async def wait_for_new_data(self):
        while not self._is_new_data:
            await asyncio.sleep(0.01)

    def __extract_logs(self, packet: bytes) -> list[bytes]:
        chunks = packets_to_9bit_bin_chunks(packet)  # data always comes in 144 bytes
        self.__runs += expand_to_runs(chunks)  # runs can vary in size
        logs: list[bytes] = []
        while len(self.__runs) >= 32:
            encoded_block = self.__runs[:32]
            self.__runs = self.__runs[32:]
            log_entry = xor_blocks(encoded_block, self.__last_log)
            self.__last_log = log_entry
            logs.append(log_entry)
        return logs

    def _on_data(self, data: bytes):
        print(f"received data: {data.hex()}")
        is_ack = bytes.fromhex("01ff0400751092") in data
        if is_ack:
            self._is_acked = True
            self._is_new_data = True
            return
        is_log_done = data[-3:] == bytes([0x77, 0x00, END_OF_FRAME])
        if is_log_done:
            return
        headless_data = data[2:]
        self._accumulator += headless_data
        if self._accumulator[-1] == END_OF_FRAME:
            self._is_new_data = True
            self._has_reached_end = (
                self._has_reached_end
                or bytes([0, 0, 0, 0, 0, 0, 0, 0]) == self._accumulator[-9:-1]
            )
            decoded = slip_decode(self._accumulator[6:])
            logs = self.__extract_logs(decoded)
            self._accumulator = bytearray()
            self.__notify_subs(logs)

    async def download(self, address: bytes):
        self._dev.subscribe(self._on_data)
        await self._send_data(bytes([0x35, 0x10, 0x34, *address]))
        while not self._is_acked:
            await asyncio.sleep(0.1)
        block_num = 1
        while not self._has_reached_end:
            await self._send_data(bytes([0x36, block_num]))
            await self.wait_for_new_data()
            block_num += 1
        await self._send_data(bytes([0x37]))
        self._dev.unsubscribe(self._on_data)


def xor_blocks(b1: bytes, b2: bytes) -> bytes:
    return bytes([b1[i] ^ b2[i] for i in range(min(len(b1), len(b2)))])


def is_open_record(data: bytes) -> bool:
    return data[0:2] == bytes([0x10, 0xFF])


class LogDecoder:
    def __init__(self):
        self.__decoders = {
            0x10: self.decode_open_record_10,
            0x11: self.decode_open_record_11,
            0x12: self.decode_open_record_12,
            0x13: self.decode_open_record_13,
            0x14: self.decode_open_record_14,
            0x15: self.decode_open_record_15,
            0x16: self.decode_open_record_16,
            0x17: self.decode_open_record_17,
            0x01: self.decode_log_record,
            0x20: self.decode_close_record_20,
            0x21: self.decode_close_record_21,
            0x22: self.decode_close_record_22,
            0x23: self.decode_close_record_21,
            0x24: self.decode_close_record_21,
            0x25: self.decode_close_record_25,
            0x26: self.decode_close_record_26,
            0x27: self.decode_close_record_27,
            0xFF: self.decode_final_record,
        }

    def decode(self, data: bytes):
        record_type = data[0]
        if record_type not in self.__decoders:
            return data.hex()  # record type in hex
        return self.__decoders[record_type](data)

    def decode_open_record_10(self, data: bytes):
        return {
            "dive_number": get_num(data[2:4]),
            "gf_low": get_num(data[4:5]),
            "gf_high": get_num(data[5:6]),
            "tts": get_num(data[6:8]),
            "depth_units": get_num(data[8:9]),
            "battery_voltage_x10": get_num(data[9:10]),
            "cns": get_num(data[10:12]),
            "dive_start": get_num(data[12:16]),
            "o2_status": get_num(data[16:17]),
            "ppo2_low_x100": get_num(data[17:18]),
            "ppo2_high_x100": get_num(data[18:19]),
            "firmware_version": get_num(data[19:20]),
            "gas_0_oc_o2": get_num(data[20:21]),
            "gas_1_oc_o2": get_num(data[21:22]),
            "gas_2_oc_o2": get_num(data[22:23]),
            "gas_3_oc_o2": get_num(data[23:24]),
            "gas_4_oc_o2": get_num(data[24:25]),
            "gas_0_cc_o2": get_num(data[25:26]),
            "gas_1_cc_o2": get_num(data[26:27]),
            "gas_2_cc_o2": get_num(data[27:28]),
            "gas_3_cc_o2": get_num(data[28:29]),
            "gas_4_cc_o2": get_num(data[29:30]),
            "gas_0_oc_he": get_num(data[30:31]),
            "gas_1_oc_he": get_num(data[31:32]),
        }

    def decode_open_record_11(self, data: bytes):
        return {
            "gas_2_oc_he": get_num(data[1:2]),
            "gas_3_oc_he": get_num(data[2:3]),
            "gas_4_oc_he": get_num(data[3:4]),
            "gas_0_cc_he": get_num(data[4:5]),
            "gas_1_cc_he": get_num(data[5:6]),
            "gas_2_cc_he": get_num(data[6:7]),
            "gas_3_cc_he": get_num(data[7:8]),
            "gas_4_cc_he": get_num(data[8:9]),
            "ccr_auto_sp_switch_up_lo_hi": get_num(data[9:10]),  # 0 - manual, 1 - auto
            "ccr_auto_sp_switch_up_depth": get_num(data[10:11]),
            "ccr_auto_sp_switch_up_hi_lo": get_num(data[11:12]),  # 0 - manual, 1 - auto
            "ccr_auto_sp_switch_down_depth": get_num(data[12:13]),
            "is_single_ppo2_sensor": get_num(data[13:14]),  # 0 - 3 sensor, 1 - 1 sensor
            "gf_low": get_num(data[14:15]),  # duplicate
            "gf_high": get_num(data[15:16]),  # duplicate
            "surface_pressure_mbars": get_num(data[16:18]),
            "serial_number": data[18:22].hex(),
        }

    def decode_open_record_12(self, data: bytes):
        return {
            "error_flags_0": get_num(data[1:5]),
            "error_flags_1": get_num(data[5:9]),
            "error_acks_0": get_num(data[9:13]),
            "error_acks_1": get_num(data[13:17]),
            "deco_model": get_num(data[18:19]),  # 0=GF, 1=VPM-B, 2=VPMB-B/GFS, 3=DCIEM
            "vpm_b_conservatism": get_num(data[19:20]),
            "solenoid_depth_compensation": get_num(data[20:21]),  # DEPRECATED
            "oc_min_ppo2_x100": get_num(data[21:22]),
            "oc_max_ppo2_x100": get_num(data[22:23]),
            "oc_deco_ppo2_x100": get_num(data[23:24]),
            "cc_min_ppo2_x100": get_num(data[24:25]),
            "cc_max_ppo2_x100": get_num(data[25:26]),
            "sensor_display": get_num(data[26:27]),  # SC only: 0=ppo2, 1=FiO2, 2=both
            "last_stop_depth": get_num(data[28:29]),
            "end_dive_delay": get_num(data[29:31]),
            "clock_format": get_num(data[31:32]),  # 0=24hr, 1=AM/PM
        }

    def decode_open_record_13(self, data: bytes):
        return {
            "title_color": get_num(data[1:2]),  # 1=green 4=blue, 8=cyan, 9=gray
            "show_ppo2_in_oc_mode": get_num(data[2:3]),
            "salinity": get_num(data[3:5]),  # in kg/m^3
            "gfs_value": get_num(data[5:6]),
            "calibration_status": get_num(
                data[6:7]
            ),  # bit 0: sensor 1, bit 1: sensor 2, bit 2: sensor 3
            "sensor_1_calibration": get_num(data[7:9]),
            "sensor_2_calibration": get_num(data[9:11]),
            "sensor_3_calibration": get_num(data[11:13]),
            "sensor_1_adc_offset": get_num(data[13:14]),
            "sensor_2_adc_offset": get_num(data[14:15]),
            "sensor_3_adc_offset": get_num(data[15:16]),
            "rMS_temp_sticks_enabled": get_num(data[16:17]),
            "rMS warmup_flags": get_num(data[17:18]),
            "rMS_ready_flags": get_num(data[18:19]),
            "rMS_scrubber_rate": get_num(
                data[19:20]
            ),  # 0=unknown, 1=surface disconnect, 2=dive disconnect, 3=pre-warm, 4=warm, 5=ready, 255=off
            "current_RCT": get_num(data[20:22]),
            "current_RST": get_num(data[22:24]),
        }

    def decode_open_record_14(self, data: bytes):
        return {
            "computer_mode": get_num(
                data[1:2]
            ),  # 0=cc/bo, 1=oc tec, 2=gauge, 3=ppo2 display, 4=sc/bo, 5=cc/bo 2, 6=oc rec, 7=freedive
            "revo2_co2_temp_gender": get_num(data[2:3]),
            "co2_temp_weight": get_num(data[3:5]),
            "battery_voltage_x100": get_num(data[5:7]),
            "battery_gauge_available": get_num(data[7:8]),
            "battery_percent_remain": get_num(data[8:9]),
            "battery_type": get_num(
                data[9:10]
            ),  # 1=1.5V alkaline, 2=1.5V lithum, 3=1.2V NiMH, 4=3.6V Saft, 5=3.7V Li-Ion
            "battery_setting": get_num(
                data[10:11]
            ),  # 0=auto, 1=1.5V alkaline, 2=1.5V lithum, 3=1.2V NiMH, 4=3.6V Saft, 5=3.7V Li-Ion
            "battery_warning_level_x100": get_num(data[11:13]),
            "battery_critical_level_x100": get_num(data[13:15]),
            "log_version": get_num(data[16:17]),
            "gas_states": get_num(data[17:19]),  # bit set for corresponding gas when on
            "temp_units": get_num(data[19:20]),  # 0=v33 and before, 2=C, 3=F
            "error_flags_2": get_num(data[20:24]),
            "error_acks_2": get_num(data[24:28]),
            "ai_mode": get_num(data[28:29]),  # 0=not used, 1=T1, 2=T2, 3=both
            "gtr_mode": get_num(data[29:30]),  # 0=not used, 1=T1, 2=T2, 3=both
            "ai_units": get_num(data[30:31]),  # 0=psi/cu.ft, 1=Bar/L
        }

    def decode_open_record_15(self, data: bytes):
        languages = [
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
        ]
        return {
            "ai_t1_serial": data[1:4].hex(),
            "ai_t1_max_psi": get_num(data[6:8]),
            "ai_t1_reserve_psi": get_num(data[8:10]),
            "ai_t2_serial": data[10:13].hex(),
            "ai_t2_max_psi": get_num(data[15:17]),
            "ai_t2_reserve_psi": get_num(data[17:19]),
            "log_sample_rate_ms": get_num(data[23:25]),
            "expected_log_sample_format": get_num(
                data[25:26]
            ),  # 0x01=normal, 0x02=freedive
            "timezone_offset": get_num(data[26:30]),
            "dst": get_num(data[30:31]),  # 0=dst off, 1=dst on
            "language": languages[get_num(data[31:32])],
        }

    def decode_open_record_16(self, data: bytes):
        return {
            "total_stack_time": get_num(data[1:3]),
            "remaining_stack_time": get_num(data[3:5]),
            "sub_mode_oc_rec": get_num(
                data[5:6]
            ),  # 0=3 Gas Nitrox, 1=air, 2=nitrox, 3=oc rec(legacy)
            "total_on_time": get_num(data[6:10]),
            "depth_alert": get_num(
                data[10:13]
            ),  # offset 10: enabled, offset 11-12: value in ft x10
            "time_alert": get_num(
                data[13:16]
            ),  # offset 13: enabled, offset 14-15: value in minutes
            "low_ndl_alert": get_num(
                data[16:19]
            ),  # offset 16: enabled, offset 17-18: value in minutes
            "ai_t1_on": get_num(data[19:20]),
            "ai_t1_name": data[20:22].hex(),
            "ai_t2_on": get_num(data[22:23]),
            "ai_t2_name": data[23:25].hex(),
            "ai_t3_serial": data[25:28].hex(),
            "ai_t3_max_psi": get_num(data[28:30]),
            "ai_t3_reserve_psi": get_num(data[30:32]),
        }

    def decode_open_record_17(self, data: bytes):
        return {
            "ai_t3_on": get_num(data[1:2]),
            "ai_t3_name": data[2:4].hex(),
            "ai_t4_serial": data[4:7].hex(),
            "ai_t4_max_psi": get_num(data[7:9]),
            "ai_t4_reserve_psi": get_num(data[9:11]),
            "ai_t4_on": get_num(data[11:12]),
            "ai_t4_name": data[12:14].hex(),
            "ai_sidemount_switch_psi": data[14:16].hex(),
            "error_flags_3": get_num(data[16:20]),
            "error_acks_3": get_num(data[20:24]),
            "extended_dive_samples_in_log": get_num(
                data[24:25]
            ),  # 0x00 = not present, 0xE1 = E1 samples are present
        }

    def decode_close_record_20(self, data: bytes):
        decoded = self.decode_open_record_10(data)
        del decoded["gf_low"]
        del decoded["gf_high"]
        del decoded["tts"]
        del decoded["depth_units"]
        del decoded["dive_start"]
        decoded["max_depth_x10"] = get_num(data[4:6])
        decoded["dive_length"] = get_num(data[6:9])
        decoded["dive_end"] = get_num(data[12:16])
        return decoded

    def decode_close_record_21(self, data: bytes):
        decoded = self.decode_open_record_11(data)
        decoded["max_descent_rate"] = get_num(data[22:24])
        decoded["avg_descent_rate"] = get_num(data[24:26])
        decoded["max_ascent_rate"] = get_num(data[26:28])
        decoded["avg_ascent_rate"] = get_num(data[28:30])
        return decoded

    def decode_close_record_22(self, data: bytes):
        return self.decode_open_record_12(data)

    def decode_close_record_23(self, data: bytes):
        decoded = self.decode_open_record_13(data)
        decoded["min_rct"] = get_num(data[24:26])
        decoded["dive_time_with_min_rct"] = get_num(data[26:28])
        decoded["min_rst"] = get_num(data[28:30])
        decoded["dive_time_with_min_rst"] = get_num(data[30:32])
        return decoded

    def decode_close_record_24(self, data: bytes):
        return self.decode_open_record_14(data)

    def decode_close_record_25(self, data: bytes):
        decoded = self.decode_open_record_15(data)
        decoded["last_avg_sac_x100"] = get_num(data[19:23])
        return decoded

    def decode_close_record_26(self, data: bytes):
        return self.decode_open_record_16(data)

    def decode_close_record_27(self, data: bytes):
        return self.decode_open_record_17(data)

    def decode_log_record(self, data: bytes):
        return {
            "depth": get_num(data[1:3]),
            "next_stop_depth": get_num(data[3:5]),
            "tts": get_num(data[5:7]),
            "avg_ppo2": get_num(data[7:8]),
            "o2_percent": get_num(data[8:9]),
            "he_percent": get_num(data[9:10]),
            "next_stop_or_ndl_time": get_num(data[10:11]),
            "battery_percent_remaining": get_num(data[11:12]),
            "statuses": get_num(data[12:13]),
            "o2_sensor_1_mv": get_num(data[13:14]),
            "water_temp": get_num(data[14:15]),
            "o2_sensor_2_mv": get_num(data[15:16]),
            "o2_sensor_3_mv": get_num(data[16:17]),
            "battery_voltage_x100": get_num(data[17:19]),
            "ppo2_setpoint": get_num(data[19:20]),
            "ai_t2_data": get_num(data[20:22]),
            "gtr": get_num(data[22:23]),
            "cns": get_num(data[23:24]),
            "deco_ceiling": get_num(data[24:25]),
            "gf99": get_num(data[25:26]),
            "at_plus_5": get_num(data[26:28]),
            "ai_t1_data": get_num(data[28:30]),
            "sac": get_num(data[30:32]),  # in psi/min
        }

    def decode_final_record(self, data: bytes):
        products = [
            "Pursuit",
            None,
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
        ]
        return {
            "serial_number": data[2:6].hex(),
            "checksum": get_num(data[9:10]),
            "firmware_version": get_num(data[10:11]),
            "log_version": get_num(data[12:13]),
            "product": products[get_num(data[13:14])],
        }


def expand_to_runs(binary_chunks: list[str]) -> bytes:
    runs = bytearray()
    for chunk in binary_chunks:
        determiner = chunk[0]
        payload = int(chunk[1:], 2)
        if determiner == "1":
            runs.append(payload)
        else:
            runs += bytes([0] * payload)
    return runs


def packets_to_9bit_bin_chunks(data: bytes) -> list[str]:
    bin_array = [bin(b)[2:].zfill(8) for b in data]
    bits_string = "".join(bin_array)
    chunks = [bits_string[i : i + 9] for i in range(0, len(bits_string), 9)]
    return chunks

async def get_manifest(dev):
    # dev = BLEShearwater()
    # await dev.connect()
    man = Manifest(dev)
    await man.read()
    # await dev.close_connection()
    print(json.dumps(man._items, indent=2))
    await asyncio.sleep(2)


async def get_a_dive(dev):
    def log_entry_received(data: bytes):
        decoder = LogDecoder()
        print(decoder.decode(data))
    # dev = BLEShearwater()
    # await dev.connect()
    divelog = LogDownloader(dev)
    divelog.subscribe(log_entry_received)
    await divelog.download(bytes([0x80, 0x07, 0x9E, 0x20]))
    await asyncio.sleep(2)
    # await dev.close_connection()

async def main():
    dev = BLEShearwater()
    await dev.connect()
    await get_manifest(dev)
    await get_a_dive(dev)
    await dev.close_connection()

if __name__ == "__main__":
    asyncio.run(main())
    # from dummy_data import packets
    # def decodeprint(packet):
    #     decoder = LogDecoder()
    #     print(decoder.decode(packet))

    # reader = LogReader()
    # reader.subscribe(decodeprint)
    # packet = ""
    # blocks = []
    # accumulator = bytearray()
    # for p in packets:
    #     reader.data_arrived(bytes.fromhex(p))
