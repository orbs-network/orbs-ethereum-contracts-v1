import BN from 'bn.js';

class Bytes {
  static numberToBuffer(num, size) {
    return (new BN(num)).toBuffer('le', size);
  }

  static prefixedHexToBuffer(address) {
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

  static padToDword(obj) {
    const mod4 = (obj.length % 4);  
    if (mod4 > 0) {
      return Buffer.concat([obj, Buffer.alloc(4-mod4)]);
    } else {
      return obj; 
    }
  }

  static padToWord(obj) {
    const mod2 = (obj.length % 2);  
    if (mod2 > 0) {
      return Buffer.concat([obj, Buffer.alloc(1)]);
    } else {
      return obj; 
    }
  }
}

module.exports = Bytes;
// Math.ceil(obj.length) - obj.length