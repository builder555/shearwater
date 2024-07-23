import { SERVICE_UUID, CHARACTERISTIC_UUID } from './constants';
import { slipEncode } from './SLIP';

export async function checkBluetoothEnabled() {
    return await navigator?.bluetooth?.getAvailability();
}

export class BLEShearwater {
    constructor() {
        this._device = null;
        this._server = null;
        this._service = null;
        this._characteristic = null;
        this._onDataCallback = null;
        this._onDisconnectCallback = null;
        this.name = '';
    }

    async connect() {
        this._device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }],
        });
        this._device.addEventListener('gattserverdisconnected', this._onDisconnected.bind(this));
        this.name = this._device.name;
        this._server = await this._device.gatt.connect();
        this._service = await this._server.getPrimaryService(SERVICE_UUID);
        this._characteristic = await this._service.getCharacteristic(CHARACTERISTIC_UUID);
        await this._characteristic.startNotifications();
        this._characteristic.addEventListener('characteristicvaluechanged', this._onCharacteristicValueChanged.bind(this));
    }

    _onDisconnected() {
        this.name = '';
        this._device = null;
        this._server = null;
        this._service = null;
        this._characteristic = null;
        if (this._onDisconnectCallback) this._onDisconnectCallback();
    }

    onDisconnect(callback) {
        this._onDisconnectCallback = callback;
    }
    
    async disconnect() {
        await this._characteristic.removeEventListener('characteristicvaluechanged', this._onCharacteristicValueChanged.bind(this));
        await this.sendData(new Uint8Array([0x2E, 0x90, 0x20, 0x00]));
        await this._server.disconnect();
    }

    _onCharacteristicValueChanged(event) {
        const data = new Uint8Array(event.target.value.buffer);
        if (this._onDataCallback) this._onDataCallback(data);
    }

    subscribe(callback) {
        this._onDataCallback = callback;
    }

    unsubscribe() {
        this.callbacks = null;
    }

    async sendData(data) {
        if (!this._device.gatt.connected) {
            await this.connect();
        }
        const prepend = new Uint8Array([0x01, 0x00, 0xFF, 0x01, data.length + 1, 0x00]);
        const dataToSend = new Uint8Array([...prepend, ...data]);
        const encodedData = slipEncode(dataToSend);
        await this._characteristic.writeValue(encodedData);
    }
}
