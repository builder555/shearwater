import { SERVICE_UUID, CHARACTERISTIC_UUID } from "./constants";
import { slipEncode } from "./SLIP";

export class BLEShearwater {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.callback = null;
        this.name = "";
    }

    isBluetoothEnabled() {
        return typeof navigator?.bluetooth?.requestDevice != 'undefined';
    }

    async connect() {
        this.device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }]
        });
        this.name = this.device.name;
        this.server = await this.device.gatt.connect();
        this.service = await this.server.getPrimaryService(SERVICE_UUID);
        this.characteristic = await this.service.getCharacteristic(CHARACTERISTIC_UUID);
        await this.characteristic.startNotifications();
        this.characteristic.addEventListener('characteristicvaluechanged', this.onCharacteristicValueChanged.bind(this));
    }
    async disconnect() {
        await this.characteristic.removeEventListener('characteristicvaluechanged', this.onCharacteristicValueChanged.bind(this));
        await this.sendData(new Uint8Array([0x2E, 0x90, 0x20, 0x00]))
        await this.server.disconnect();
        this.name = "";
    }

    onCharacteristicValueChanged(event) {
        const data = new Uint8Array(event.target.value.buffer);
        if (this.callback) this.callback(data);
    }

    subscribe(callback) {
        this.callback = callback;
    }

    unsubscribe() {
        this.callbacks = null;
    }

    async sendData(data) {
        if (!this.device.gatt.connected) {
            await this.connect();
        }
        const prepend = new Uint8Array([0x01, 0x00, 0xFF, 0x01, data.length + 1, 0x00])
        const dataToSend = new Uint8Array([...prepend, ...data]);
        const encodedData = slipEncode(dataToSend);
        await this.characteristic.writeValue(encodedData);
    }
}
