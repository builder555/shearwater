const END_OF_FRAME = 0xC0;
const ESC_CODE = 0xDB;
const ESC_END = 0xDC;
const ESC_ESC = 0xDD;
const SERVICE_UUID = "fe25c237-0ece-443c-b0aa-e02033e7029d";
const CHARACTERISTIC_UUID = "27b7570b-359e-45a3-91bb-cf7e70049bd2";

function slipDecode(data) {
    if (data == null || data.length < 1) {
        return null;
    }
    const decodedData = new Uint8Array(data.length);
    let decodedDataIndex = 0;
    let i = 0;
    while (i < data.length) {
        if (data[i] === END_OF_FRAME) {
            if (decodedDataIndex > 0) {
                // Resize the decoded data to its exact length
                return decodedData.slice(0, decodedDataIndex);
            }
        } else if (data[i] === ESC_CODE) {
            i++;
            if (i < data.length) {
                if (data[i] === ESC_END) {
                    decodedData[decodedDataIndex] = 0xC0;
                } else if (data[i] === ESC_ESC) {
                    decodedData[decodedDataIndex] = 0xDB;
                } else {
                    decodedData[decodedDataIndex] = data[i];
                }
                decodedDataIndex++;
            }
        } else {
            decodedData[decodedDataIndex] = data[i];
            decodedDataIndex++;
        }
        i++;
    }
    return null;
}

function slipEncode(data) {
    const encoded = [];
    data.forEach(byte => {
        if (byte === END_OF_FRAME) {
            encoded.push(ESC_CODE, ESC_END);
        } else if (byte === ESC_CODE) {
            encoded.push(ESC_CODE, ESC_ESC);
        } else {
            encoded.push(byte);
        }
    });
    encoded.push(END_OF_FRAME);
    return new Uint8Array(encoded);
}

class BLEDevice {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.callback = null;
    }

    async connect() {
        this.device = await navigator.bluetooth.requestDevice({
            filters: [{ services: [SERVICE_UUID] }]
        });
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
    }

    onCharacteristicValueChanged(event) {
        const data = new Uint8Array(event.target.value.buffer);
        if (this.callback) this.callback(data);
    }

    async subscribe(callback) {
        if (!this.callback) {
            await this.connect();
        }
        this.callback = callback;
    }

    async unsubscribe() {
        this.callbacks = null;
        await this.disconnect();
    }

    async sendData(data) {
        const prepend = new Uint8Array([0x01, 0x00, 0xFF, 0x01, data.length + 1, 0x00])
        const dataToSend = new Uint8Array([...prepend, ...data]);
        // const dataToSend = new Uint8Array(prepend.length + data.length);
        // dataToSend.set(prepend);
        // dataToSend.set(data, prepend.length);
        const encodedData = slipEncode(dataToSend);
        console.log('sending', encodedData);
        await this.characteristic.writeValue(encodedData);
    }
}
function isSubArray(subArray, array) {
    for (let i = 0; i <= array.length - subArray.length; i++) {
      let match = true;
      for (let j = 0; j < subArray.length; j++) {
        if (array[i + j] !== subArray[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        return true;
      }
    }
    return false;
}
function decodeManifest(data) {
    function getNum(data) {
      return data.reduce((acc, byte) => (acc << 8) | byte, 0);
    }
  
    function getDate(timestamp) {
      return new Date(timestamp * 1000).toISOString().replace('T', ' ').slice(0, 19);
    }
  
    function getHhMmSs(timestamp) {
      const date = new Date(timestamp * 1000);
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      return `${hours}h ${minutes}m ${seconds}s`;
    }
  
    const depthUnits = {
      0: "meters",
      1: "feet"
    };
  
    const computerMode = {
      0: "CC/BO",
      1: "OC Tec",
      2: "Gauge",
      3: "PPO2 Display",
      4: "SC/BO",
      5: "CC/BO 2",
      6: "OC Rec",
      7: "Freedive"
    };
  
    const dive = {
      code: Array.from(data.slice(0, 2)).map(byte => byte.toString(16).padStart(2, '0')).join(''),
      diveNo: getNum(data.slice(2, 4)),
      diveStart: getDate(getNum(data.slice(4, 8))),
      diveEnd: getDate(getNum(data.slice(8, 12))),
      diveDuration: getHhMmSs(getNum(data.slice(12, 16))),
      maxDepthX10: getNum(data.slice(16, 18)),
      avgDepthX10: getNum(data.slice(18, 20)),
      recordAddressStart: Array.from(data.slice(20, 24)).map(byte => byte.toString(16).padStart(2, '0')).join(''),
      recordAddressEnd: Array.from(data.slice(24, 28)).map(byte => byte.toString(16).padStart(2, '0')).join(''),
      depthUnits: depthUnits[getNum(data.slice(28, 29))],
      tempUnits: getNum(data.slice(29, 30)), // ignore
      computerMode: computerMode[getNum(data.slice(30, 31))],
      manifestVersion: getNum(data.slice(31, 32)) // 0 - original, 1 - adds dive computer mode
    };
  
    return dive;
  }

class Manifest {
    constructor(dev) {
      this._dev = dev;
      this._isAcked = false;
      this._accumulator = new Uint8Array();
      this._manifests = [];
      this._hasReachedEnd = false;
      this._isNewData = false;
    }
  
    async _sendData(data) {
      this._isNewData = false;
      await this._dev.sendData(data);
    }
  
    async waitForNewData() {
      while (!this._isNewData) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  
    _onData(data) {
      console.log('received data:', data);
      const isManifestAck = isSubArray(new Uint8Array([0x01, 0xff, 0x04, 0x00, 0x75, 0x10, 0x82]), data);
      if (isManifestAck) {
        this._isAcked = true;
        this._isNewData = true;
        return;
      }
      const headlessData = data.slice(2);
      this._accumulator = new Uint8Array([...this._accumulator, ...headlessData]);
      if (this._accumulator[this._accumulator.length - 1] === END_OF_FRAME) {
        this._isNewData = true;
        this.decodeManifests();
        this._accumulator = new Uint8Array();
        this._hasReachedEnd = this._hasReachedEnd || isSubArray(new Uint8Array([0, 0, 0, 0, 0, 0, 0]), data);
      }
    }
  
    decodeManifests() {
      const extractManifests = (data) => {
        const payload = data.slice(6);
        const manifests = [];
        for (let i = 0; i < payload.length; i += 32) {
          manifests.push(payload.slice(i, i + 32));
        }
        return manifests.filter(m => m[0] === 0xA5 && m[1] === 0xC4);
      };
  
      const data = this._accumulator;
      const isPacketOk = data[0] === 0x01 && data[1] === 0xFF && data[3] === 0x00;
      if (!isPacketOk) {
        throw new Error(`Invalid packet: ${Array.from(data).map(byte => byte.toString(16).padStart(2, '0')).join('')}`);
      }
      const decoded = slipDecode(data);
      if (!decoded) {
        throw new Error(`Failed to decode: ${Array.from(data).map(byte => byte.toString(16).padStart(2, '0')).join('')}`);
      }
      const manifests = extractManifests(decoded);
      manifests.forEach(manifest => {
        this._manifests.push(decodeManifest(manifest));
      });
    }
  
    async read() {
      await this._dev.subscribe(this._onData.bind(this));
      await this._sendData(new Uint8Array([0x35, 0x00, 0x34, 0xE0, 0x00, 0x00, 0x00]));
      while (!this._isAcked) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      let blockNum = 1;
      while (!this._hasReachedEnd) {
        await this._sendData(new Uint8Array([0x36, blockNum]));
        await this.waitForNewData();
        blockNum++;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      await this._dev.unsubscribe();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
}
  
  

document.getElementById('connect').addEventListener('click', async () => {
    if (typeof navigator == 'undefined' || typeof navigator.bluetooth == 'undefined' || typeof navigator.bluetooth.requestDevice == 'undefined' ) {
        return false;
      }
    
    autoconnect = typeof navigator.bluetooth.getDevices != 'undefined'
    console.log('Autoconnect support (chrome://flags/#enable-web-bluetooth-new-permissions-backend)', autoconnect ? 'enabled (only works in anonymous mode).':'disabled.');

    const dev = new BLEDevice();
    const manifest = new Manifest(dev);
    await manifest.read();
    console.log(manifest._manifests);
});