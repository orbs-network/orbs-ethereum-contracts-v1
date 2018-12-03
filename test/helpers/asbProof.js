import BN from 'bn.js';

const numberToBuffer = (num, size) => (new BN(num)).toBuffer('le', size);
const addressToBuffer = (address) => {
  const hex = address.startsWith('0x') ? address.substr(2) : address;
  return Buffer.from(hex, 'hex');
}

class ASBProof {
  // Builds and serializes Autonomous Swap Event Data according to:
  // +----------------------+--------+------+------------+
  // |        Field         | Offset | Size |  Encoding  |
  // +----------------------+--------+------+------------+
  // | contract name length | 0      | 4    | uint32     |
  // | contract name        | 4      | N    | string     |
  // | event_id             | TBD    | 4    | uint32     |
  // | tuid                 | TBD    | 8    | uint64     |
  // | ethereum_address     | TBD    | 20   | bytes(20B) |
  // | tokens               | TBD    | 32   | bytes(32B) |
  // +----------------------+--------+------+------------+
  static buildEventData(orbsContractName, eventId, tuid, ethereumAddress, tokens) {
    const contractNameLengthBuffer = numberToBuffer(orbsContractName.length, 4);
    const contractNameBuffer = Buffer.from(orbsContractName);
    const eventIdBuffer = numberToBuffer(eventId, 4);
    const tuidBuffer = numberToBuffer(tuid, 8);
    const ethereumAddressBuffer = addressToBuffer(ethereumAddress);
    const tokensBuffer = numberToBuffer(tokens, 32);

    return Buffer.concat([
      contractNameLengthBuffer,
      contractNameBuffer,
      eventIdBuffer,
      tuidBuffer,
      ethereumAddressBuffer,
      tokensBuffer,
    ]);
  }

}

class ASBProofBuilder {
  constructor(token, federation, verifier) {
    this.token = token;
    this.federation = federation;
    this.verifier = verifier;
  }
}

module.exports = { ASBProof, ASBProofBuilder };
