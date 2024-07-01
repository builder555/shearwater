from bleak import BleakClient, BleakScanner
import asyncio

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
            # Check the next byte
            i += 1
            if i < len(data):
                if data[i] == ESC_END:
                    decoded_data[decoded_data_index] = END_OF_FRAME
                elif data[i] == ESC_ESC:
                    decoded_data[decoded_data_index] = ESC_CODE
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
        self._client: BleakClient|None = None
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
        await self._client.start_notify(CHARACTERISTIC_UUID, self.received_data)

    async def received_data(self, _, data):
        print(f"Received: {data.hex()}")
        # decoded = slip_decode(data)
        self._queue += data
    
    async def send_data(self, data: bytes):
        if self._client is None:
            raise DeviceNotConnected
        prepend = bytes([0x01, 0x00, 0xFF, 0x01, len(data)+1, 0x00])
        encoded = slip_encode(prepend+data)
        await self._client.write_gatt_char(CHARACTERISTIC_UUID, encoded)
    async def read_data(self) -> bytearray:
        while not (data := self._queue):
            await asyncio.sleep(2)
        self._queue = bytearray()
        return data
    async def close_connection(self):
        if self._client is None:
            raise DeviceNotConnected
        await self._client.stop_notify(CHARACTERISTIC_UUID)
        await self.send_data(bytes([0x2E, 0x90, 0x20, 0x00]))
        await self._client.disconnect()
        

async def main():
    dev = BLEShearwater()
    await dev.connect()
    await dev.send_data(bytes([0x35, 0x00, 0x34, 0xE0, 0x00, 0x00, 0x00, 0xFF]))
    ack = await dev.read_data()
    print(f'ack: {ack.hex()}')
    block = 1
    recvd = bytearray()
    while len(recvd) <= 0xFF:
        await dev.send_data(bytes([0x36, block]))
        recvd += await dev.read_data()
        block += 1
    print(recvd.hex())
    await dev.close_connection()

if __name__ == '__main__':
    # asyncio.run(detect_device())
    asyncio.run(main())