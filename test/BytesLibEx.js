import chai from 'chai';
import BigNumber from 'bignumber.js';

import Bytes from './helpers/bytes';
import expectRevert from './helpers/expectRevert';

const { expect } = chai;

const BytesLibExWrapper = artifacts.require('./BytesLibExWrapper.sol');

contract('BytesLibEx', () => {
  let bytesLib;

  beforeEach(async () => {
    bytesLib = await BytesLibExWrapper.new();
  });

  it('should error on an insufficient empty buffer', async () => {
    await expectRevert(bytesLib.toBytes20.call('', 0));
    await expectRevert(bytesLib.toBytes20.call('0xbadbeef', 0));
    await expectRevert(bytesLib.toBytes20.call('0xb36b0c0fb6f807400cae4c1dd538a8dbcc72d7', 0));

    const longEnough = '0xb36b0c0fb6f807400cae4c1dd538a8dbcc72d7b36b0c0fb6f807400cae4c1dd538a8dbcc72d7';
    await expectRevert(bytesLib.toBytes20.call(longEnough, longEnough.length - 10 + 1));
  });

  it('should convert to bytes20', async () => {
    const longEnough = '0xb36b0c0fb6f807400cae4c1dd538a8dbcc72d7d605ba20aa80b4e8e207a77c851c4f7d647989211c';

    expect(await bytesLib.toBytes20.call(longEnough, 0)).to.eql('0xb36b0c0fb6f807400cae4c1dd538a8dbcc72d7d6');
    expect(await bytesLib.toBytes20.call(longEnough, 5)).to.eql('0xf807400cae4c1dd538a8dbcc72d7d605ba20aa80');
    expect(await bytesLib.toBytes20.call(longEnough, 20)).to.eql('0x05ba20aa80b4e8e207a77c851c4f7d647989211c');
  });

  [
    '0x00000005',
    '0x0000051a',
    '0x0bcd1234',
  ].forEach((spec) => {
    it(`should convert ${spec} to uint32`, async () => {
      expect(await bytesLib.toUint32.call(spec, 0)).to.be.bignumber.equal(new BigNumber(spec));
    });
  });

  [
    '0x0000000000000005',
    '0x000000000000051a',
    '0xbcd1234000000000',
  ].forEach((spec) => {
    it(`should convert ${spec} to uint64`, async () => {
      expect(await bytesLib.toUint64.call(spec, 0)).to.be.bignumber.equal(new BigNumber(spec));
    });
  });

  [
    '0x00000005',
    '0x0000051a',
    '0x0bcd1234',
  ].forEach((spec) => {
    it.(`should convert a big-endian ${spec} to uint32`, async () => {
      expect(await bytesLib.toUint32BE.call(spec, 0)).to.be.bignumber
        .equal(new BigNumber(Bytes.switchEndianness(spec)));
    });
  });

  [
    '0x0000000000000005',
    '0x000000000000051a',
    '0xbcd1234000000000',
  ].forEach((spec) => {
    it.(`should convert a big-endian ${spec} to uint64`, async () => {
      expect(await bytesLib.toUint64BE.call(spec, 0)).to.be.bignumber
        .equal(new BigNumber(Bytes.switchEndianness(spec)));
    });
  });

  [
    '0x0000000000000000000000000000000000000000000000000000000000000005',
    '0x00000000000000000000000000000000000000000000000000000000000aa51a',
    '0xbcd1234000000000000000000000000000000000000000000000000000000000',
  ].forEach((spec) => {
    it.(`should convert a big-endian ${spec} to uint`, async () => {
      expect(await bytesLib.toUintBE.call(spec, 0)).to.be.bignumber
        .equal(new BigNumber(Bytes.switchEndianness(spec)));
    });
  });
});
