import BN from 'bn.js';

class Bytes {
  static numberToBuffer(num, size) {
    return (new BN(num)).toBuffer('le', size);
  }

  static addressToBuffer(address) {
    const hex = address.startsWith('0x') ? address.substr(2) : address;
    return Buffer.from(hex, 'hex');
  }

  static switchEndianness(obj) {
    let buffer;

    const string = typeof obj === 'string' || obj instanceof String;
    if (string) {
      const hex = obj.startsWith('0x') ? obj.substr(2) : obj;
      buffer = Buffer.from(hex, 'hex');
    }

    const newBuffer = Buffer.from(buffer);

    for (let i = 0; i < buffer.length; ++i) {
      newBuffer[buffer.length - i - 1] = buffer[i];
    }

    return string ? `0x${newBuffer.toString('hex')}` : newBuffer;
  }
}

module.exports = Bytes;
