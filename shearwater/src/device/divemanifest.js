import { END_OF_FRAME } from './constants';
import { slipDecode } from './SLIP';
import { getDateTime, getHhMmSs } from './date.functions';

function decodeManifest(data) {
  function getNum(data) {
    return data.reduce((acc, byte) => (acc << 8) | byte, 0);
  }


  const depthUnits = {
    0: 'meters',
    1: 'feet',
  };

  const computerMode = {
    0: 'CC/BO',
    1: 'OC Tec',
    2: 'Gauge',
    3: 'PPO2 Display',
    4: 'SC/BO',
    5: 'CC/BO 2',
    6: 'OC Rec',
    7: 'Freedive',
  };
  const dive = {
    isDownloaded: false,
    canDownload: true,
    code: Array.from(data.slice(0, 2))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join(''),
    diveNo: getNum(data.slice(2, 4)),
    diveStart: getDateTime(getNum(data.slice(4, 8))),
    diveEnd: getDateTime(getNum(data.slice(8, 12))),
    diveDuration: getNum(data.slice(12, 16)),
    maxDepthX10: getNum(data.slice(16, 18)),
    avgDepthX10: getNum(data.slice(18, 20)),
    recordAddressStart: data.slice(20, 24),
    recordAddressEnd: data.slice(24, 28),
    depthUnits: depthUnits[getNum(data.slice(28, 29))],
    tempUnits: getNum(data.slice(29, 30)), // ignore
    computerMode: computerMode[getNum(data.slice(30, 31))],
    manifestVersion: getNum(data.slice(31, 32)), // 0 - original, 1 - adds dive computer mode
  };
  const dateStart = new Date(dive.diveStart);
  const hexAddressEnd = Array.from(dive.recordAddressEnd)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  const hexAddressStart = Array.from(dive.recordAddressStart)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  dive.id = `${hexAddressStart}-${hexAddressEnd}`;
  dive.startDateFmt = dateStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  dive.startTimeFmt = dateStart.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  dive.diveDurationFmt = getHhMmSs(dive.diveDuration);
  dive.maxDepth = dive.maxDepthX10 / 10;
  dive.avgDepth = dive.avgDepthX10 / 10;

  return dive;
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

export class DiveManifestReader {
  constructor(dev) {
    this._dev = dev;
    this._isAcked = false;
    this._accumulator = new Uint8Array();
    this._manifests = [];
    this._hasReachedEnd = false;
    this._isNewData = false;
    this._progressCallback = () => {};
  }

  async _sendData(data) {
    this._isNewData = false;
    await this._dev.sendData(data);
  }

  async waitForNewData() {
    while (!this._isNewData) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  _onData(data) {
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
      return manifests.filter((m) => m[0] === 0xa5 && m[1] === 0xc4);
    };

    const data = this._accumulator;
    const isPacketOk = data[0] === 0x01 && data[1] === 0xff && data[3] === 0x00;
    if (!isPacketOk) {
      throw new Error(
        `Invalid packet: ${Array.from(data)
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('')}`,
      );
    }
    const decoded = slipDecode(data);
    if (!decoded) {
      const hex = Array.from(data)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      throw new Error(`Failed to decode: ${hex}`);
    }
    const manifests = extractManifests(decoded);
    manifests.forEach((manifest) => {
      this._manifests.push(decodeManifest(manifest));
    });
  }
  onProgress(callback) {
    this._progressCallback = callback;
  }
  async read() {
    await this._dev.subscribe(this._onData.bind(this));
    const blocks = 12;
    await this._sendData(new Uint8Array([0x35, 0x00, 0x34, 0xe0, 0x00, 0x00, 0x00]));
    while (!this._isAcked) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    for (let i = 1; i <= blocks; i++) {
      await this._sendData(new Uint8Array([0x36, i]));
      this._progressCallback(i / blocks);
      await this.waitForNewData();
    }
    await this._sendData(new Uint8Array([0x37]));
    await this._dev.unsubscribe();
    return this._manifests;
  }
}
