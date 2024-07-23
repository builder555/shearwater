import { END_OF_FRAME, ESC_CODE, ESC_END, ESC_ESC } from './constants';

export function slipEncode(data) {
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

export function slipDecode(data) {
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
