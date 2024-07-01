from bleak import BleakClient, BleakScanner
import asyncio

END_OF_FRAME = 0xC0
ESC_CODE = 0xDB
ESC_END = 0xDC
ESC_ESC = 0xDD
SERVICE_UUID = "FE25C237-0ECE-443C-B0AA-E02033E7029D"  #
CHARACTERISTIC_UUID = "27B7570B-359E-45A3-91BB-CF7E70049BD2"  #

def slip_decode(data):
    decoded = bytearray()
    i = 0
    while i < len(data):
        if data[i] == ESC_CODE:
            i += 1
            if data[i] == ESC_END:
                decoded.append(END_OF_FRAME)
            elif data[i] == ESC_ESC:
                decoded.append(ESC_CODE)
        else:
            decoded.append(data[i])
        i += 1
    return decoded

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
def notification_handler(sender, data):
    print(f"Received: {data.hex()}")

async def send_data(client: BleakClient, data: bytearray):
    prepend = bytes([0x01, 0x00, 0xFF, 0x01, len(data)+1, 0x00])
    encoded = slip_encode(prepend+data)
    await client.write_gatt_char(CHARACTERISTIC_UUID, encoded)
    
async def detect_device():
    devices = await BleakScanner.discover()
    for d in devices:
        if d.name and 'perdix' in d.name.lower():
            target_device = d
            print(f'perdix found: {target_device}')
            break
    else:
        print('perdix not found')
        return

    async with BleakClient(target_device) as client:
        await client.start_notify(CHARACTERISTIC_UUID, notification_handler)

        payload = bytearray([0x35, 0x00, 0x34, 0xE0, 0x00, 0x00, 0x00])
        await send_data(client, payload)
        await asyncio.sleep(2)

        await client.stop_notify(CHARACTERISTIC_UUID)
        
if __name__ == '__main__':
    asyncio.run(detect_device())
