from bleak import BleakClient, BleakScanner
import asyncio
import sliplib
# import struct
# import time

# 1. connect to device
# 2. request "upload" 
# 3. download data

async def get_all_ble_services(address):
    async with BleakClient(address) as client:
        await client.connect()
        print('----------------------------------')
        for service in client.services:
            # if service.uuid != settings_uuid and service.uuid != bulk_data_uuid:
            # if service.uuid == live_data_uuid:
            # if service.uuid == settings_uuid:
            # if service.uuid == bulk_data_uuid:
                print('svc', service.uuid)
                service = client.services.get_service(service.uuid)
                for char in service.characteristics:
                    # print every char property:
                    # print(char.uuid)
                        # props = dir(char)
                        # for prop in props:
                        #     if not prop.startswith('_'):
                        #         print('\t', prop, getattr(char, prop))
                    raw_value = await client.read_gatt_char(char)
                    # value = struct.unpack(f'<H', raw_value)
                    print(f'{char.uuid}: {raw_value}, value')
                    # numbers = len(raw_value) >> 2 # divide by 4
                    # value = struct.unpack(f'<{numbers}I', raw_value)
                    # for i, val in enumerate(value):
                    #     print(f'\t{raw_data_map[i]:<25}: {val}')
                    print('\t', char.uuid)
                    # print('\t', char.description)
                    # print('\t', char.properties)


async def list_ble_devices():
    # def simple_callback(device, advertisement_data):
    #     print(device.address, advertisement_data)


    # # async def run(args):
    # scanner = BleakScanner(
    #     simple_callback, [], cb=dict(use_bdaddr=True)
    # )
    # while True:
    #     # logger.info("(re)starting scanner")
    #     await scanner.start()
    #     await asyncio.sleep(5.0)
    #     await scanner.stop()

    devices = await BleakScanner(use_bdaddr=True).discover()
    for d in devices:
        # if str(d.name).lower().startswith('pinecil'):
            print(dir(d))
            print(d.name)
            print(d.address)
            print(d.details)
            print(d.metadata)
            # print(dir(d.details))
            print('-------------------------')


# async def print_live_data():
#     async with BleakClient(address) as client:
#         await client.connect()
#         service = client.services.get_service(live_data_uuid)
#         read_chars = []
#         for crx in service.characteristics:
#             if crx.uuid in names:
#                 read_chars.append(crx)
#         while True:
#             print("\033[2;1H", end='')
#             for char in read_chars:
#                 value = await client.read_gatt_char(char)
#                 value2 = struct.unpack('<L', value)[0]
#                 print(f'{names[char.uuid]:<15} {value} - {value2}')
#             time.sleep(1.5)

# async def print_live_bulk_data():
#     async with BleakClient(address) as client:
#         await client.connect()
#         service = client.services.get_service(bulk_data_uuid)
#         read_chars = []
#         for crx in service.characteristics:
#             if crx.uuid in names:
#                 read_chars.append(crx)
#         while True:
#             print("\033[2;1H", end='')
#             for char in read_chars:
#                 raw_value = await client.read_gatt_char(char)
#                 numbers = len(raw_value) >> 2 # divide by 4
#                 value = struct.unpack(f'<{numbers}I', raw_value)
#                 for i, val in enumerate(value):
#                     print(f'\t{raw_data_map[i]:<25}: {val:<20}')
#             # time.sleep(1.5)

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
        # for i in range (0, 20):
        #     request_data =bytearray([0xFF, 0x01, i, 0x00, 0x35, 0x00, 0x34, 0xE0, 0x00, 0x00, 0x00])
        #     encoded_request = slip_encode(request_data)
        #     print(f"Sending: {encoded_request}")
        #     await client.write_gatt_char(CHARACTERISTIC_UUID, encoded_request)
        #     await asyncio.sleep(1)
        # # encoded_request = sliplib.encode(bytearray([0x01, 0x00, 0xFF, 0x01, 0x04, 0x00, 0x22, 0x80, 0x10]))

        payload = bytearray([0x35, 0x00, 0x34, 0xE0, 0x00, 0x00, 0x00])
        await send_data(client, payload)
        await asyncio.sleep(2)

        # plain = bytearray([0x01, 0x00, 0xFF, 0x01, 0x04, 0x00, 0x22, 0x80, 0x10]) #gets a response
        # await send_data(client, plain)

        await client.stop_notify(CHARACTERISTIC_UUID)
        
if __name__ == '__main__':
    asyncio.run(detect_device())
    # encoded = bytearray([0x01, 0x00, 0xFF, 0x01, 0x04, 0x00, 0x22, 0x80, 0x10, END_OF_FRAME])
    # print(sliplib.decode(encoded).hex())
    # print(sliplib.encode(bytearray([0x01, 0x00, 0xFF, 0x01, 0x04, 0x00, 0x22, 0x80, 0x10])).hex())

    # asyncio.run(print_live_bulk_data())
    # asyncio.run(get_all_ble_services('A23545D6-042D-D917-35C4-A9F705CB4990'))
    # asyncio.run(list_ble_devices())
