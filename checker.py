from bleak import BleakClient, BleakScanner
from bleak.backends.characteristic import BleakGATTCharacteristic
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

def slip_decode(data):
    if data is None or len(data) < 1:
        return None
    
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
    return None
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

class DeviceNotFound(Exception): pass
class DeviceNotConnected(Exception): pass

class BLEShearwater:
    def __init__(self):
        self._queue = bytearray()
        self._accumulator = bytearray()
        self._client: BleakClient|None = None
        self._callbacks = []
    async def subscribe(self, callback: Callable):
        if not self._callbacks:
            await self.connect()
        if callback in self._callbacks:
            return
        self._callbacks.append(callback)
    async def unsubscribe(self, callback: Callable):
        self._callbacks.remove(callback)
        if not self._callbacks:
            await self.close_connection()
    async def connect(self):
        devices = await BleakScanner.discover()
        for d in devices:
            if d.name and 'perdix' in d.name.lower():
                target_device = d
                print(f'perdix found: {target_device}')
                break
        else:
            raise DeviceNotFound
        self._client = BleakClient(target_device)
        await self._client.connect()
        await self._client.start_notify(CHARACTERISTIC_UUID, self.got_new_data)

    def got_new_data(self, sender: BleakGATTCharacteristic, data: bytearray):
        for callback in self._callbacks:
            callback(data)

    async def send_data(self, data: bytes):
        if self._client is None:
            raise DeviceNotConnected
        prepend = bytes([0x01, 0x00, 0xFF, 0x01, len(data)+1, 0x00])
        encoded = slip_encode(prepend+data)
        await self._client.write_gatt_char(CHARACTERISTIC_UUID, encoded)

    async def close_connection(self):
        if self._client is None:
            raise DeviceNotConnected
        await self._client.stop_notify(CHARACTERISTIC_UUID)
        await self.send_data(bytes([0x2E, 0x90, 0x20, 0x00]))
        await self._client.disconnect()

def decode_manifest(data:bytes):
    def get_num(data:bytes):
        return int.from_bytes(data, byteorder='big')

    def get_date(timestamp:int):
        # shearwater does not have a concept of timezones, so it shows as UTC
        return datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    def get_hh_mm_ss(timestamp:int):
        return datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc).strftime("%Hh %Mm %Ss")
    depth_units = {
        0: 'meters',
        1: 'feet',
    }
    computer_mode = {
        0 : "CC/BO",
        1 : "OC Tec",
        2 : "Gauge",
        3 : "PPO2 Display",
        4 : "SC/BO",
        5 : "CC/BO 2",
        6 : "OC Rec",
        7 : "Freedive",
    }
    dive = {
        "code" : data[0:2].hex(),
        "dive_no" : get_num(data[2:4]),
        "dive_start" : get_date(get_num(data[4:8])),
        "dive_end" : get_date(get_num(data[8:12])),
        "dive_duration" : get_hh_mm_ss(get_num(data[12:16])),
        "max_depth_x10" : get_num(data[16:18]),
        "avg_depth_x10" : get_num(data[18:20]),
        "record_address_start": data[20:24].hex(),
        "record_address_end": data[24:28].hex(),
        "depth_units": depth_units[get_num(data[28:29])],
        "temp_units": get_num(data[29:30]), # ignore
        "computer_mode": computer_mode[get_num(data[30:31])],
        "manifest_version": get_num(data[31:32]), # 0 - original, 1 - adds dive computer mode
    }
    return dive


class Manifest:
    def __init__(self, dev: BLEShearwater):
        self._dev = dev
        self._is_acked = False
        self._accumulator = bytearray()
        self._manifests = []
        self._has_reached_end = False
        self._is_new_data = False
    async def _send_data(self, data: bytes):
        self._is_new_data = False
        await self._dev.send_data(data)
    async def wait_for_new_data(self):
        while not self._is_new_data:
            await asyncio.sleep(0.1)
    def _on_data(self, data: bytes):
        print(f'received data: {data.hex()}')
        is_manifest_ack = bytes.fromhex('01ff0400751082') in data
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
            self._has_reached_end = self._has_reached_end or bytes([0,0,0,0,0,0,0]) in data
    def decode_manifests(self):
        def extract_manifests(data:bytes) -> list[bytes]:
            payload = data[6:]
            manifests = [payload[i:i+32] for i in range(0, len(payload), 32)]
            all_ok = [True for m in manifests if m[0] == 0xa5 and m[1] == 0xc4]
            if not all_ok:
                raise Exception("Not all manifests start with 0xa5 0xc4")
            return manifests

        data = self._accumulator
        is_packet_ok = data[0:2] == bytes([0x01, 0xFF]) and data[3:4] == bytes([0x00])
        if not is_packet_ok:
            raise Exception(f"Invalid packet: {data.hex()}")
        decoded = slip_decode(data)
        if not decoded:
            raise Exception(f"Failed to decode: {data.hex()}")
        manifests = extract_manifests(decoded)
        for manifest in manifests:
            self._manifests.append(decode_manifest(manifest))

    async def read(self):
        await self._dev.subscribe(self._on_data)
        await self._send_data(bytes([0x35, 0x00, 0x34, 0xE0, 0x00, 0x00, 0x00]))
        while not self._is_acked:
            await asyncio.sleep(0.1)
        block_num = 1
        while not self._has_reached_end:
            await self._send_data(bytes([0x36, block_num]))
            await self.wait_for_new_data()
            block_num += 1
        await asyncio.sleep(0.5)
        await self._dev.unsubscribe(self._on_data)
        await asyncio.sleep(0.5)


async def main():
    dev = BLEShearwater()
    man = Manifest(dev)
    await man.read()
    print(json.dumps(man._manifests, indent=2))

if __name__ == '__main__':
    asyncio.run(main())
