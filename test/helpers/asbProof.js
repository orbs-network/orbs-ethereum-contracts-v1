import Bytes from './bytes';

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
    const contractNameLengthBuffer = Bytes.numberToBuffer(orbsContractName.length, 4);
    const contractNameBuffer = Buffer.from(orbsContractName);
    const eventIdBuffer = Bytes.numberToBuffer(eventId, 4);
    const tuidBuffer = Bytes.numberToBuffer(tuid, 8);
    const ethereumAddressBuffer = Bytes.addressToBuffer(ethereumAddress);
    const tokensBuffer = Bytes.numberToBuffer(tokens, 32);

    // const event = ASBProof.buildEventData('Hello', 12, 567, '0x2c80c37bdf6d68390ccaa03a125f65dcc43b7a5f', 1500);

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
