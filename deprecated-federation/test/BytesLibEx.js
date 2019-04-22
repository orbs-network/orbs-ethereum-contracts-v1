/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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

  describe('toBytes20', async () => {
    it('should error when buffer is too small', async () => {
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
  });

  describe('toUint', async () => {
    [
      '0x0005',
      '0x051a',
      '0x1234',
    ].forEach((spec) => {
      it(`should convert ${spec} to uint16`, async () => {
        expect(await bytesLib.toUint16.call(spec, 0)).to.be.bignumber.equal(new BigNumber(spec));
      });
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

    it('should error when buffer is too short', async () => {
      await expectRevert(bytesLib.toUint16.call('0x1', 0));
      await expectRevert(bytesLib.toUint16.call('0x0000051a', 3));
      await expectRevert(bytesLib.toUint32.call('0x01', 0));
      await expectRevert(bytesLib.toUint32.call('0x0000051a', 2));
      await expectRevert(bytesLib.toUint64.call('0x01', 0));
      await expectRevert(bytesLib.toUint64.call('0xbcd1234000000000', 4));
    });
  });

  describe('toUintBE', async () => {
    [
      '0x0005',
      '0x051a',
      '0x1234',
    ].forEach((spec) => {
      it(`should convert a big-endian ${spec} to uint16`, async () => {
        expect(await bytesLib.toUint16BE.call(spec, 0)).to.be.bignumber
          .equal(new BigNumber(Bytes.switchEndianness(spec)));
      });
    });
  
    [
      '0x00000005',
      '0x0000051a',
      '0x0bcd1234',
    ].forEach((spec) => {
      it(`should convert a big-endian ${spec} to uint32`, async () => {
        expect(await bytesLib.toUint32BE.call(spec, 0)).to.be.bignumber
          .equal(new BigNumber(Bytes.switchEndianness(spec)));
      });
    });
  
    [
      '0x0000000000000005',
      '0x000000000000051a',
      '0xbcd1234000000000',
    ].forEach((spec) => {
      it(`should convert a big-endian ${spec} to uint64`, async () => {
        expect(await bytesLib.toUint64BE.call(spec, 0)).to.be.bignumber
          .equal(new BigNumber(Bytes.switchEndianness(spec)));
      });
    });

    [
      '0x0000000000000000000000000000000000000000000000000000000000000005',
      '0x00000000000000000000000000000000000000000000000000000000000aa51a',
      '0xbcd1234000000000000000000000000000000000000000000000000000000000',
    ].forEach((spec) => {
      it(`should convert a big-endian ${spec} to uint`, async () => {
        expect(await bytesLib.toUintBE.call(spec, 0)).to.be.bignumber
          .equal(new BigNumber(Bytes.switchEndianness(spec)));
      });
    });

    it('should error when buffer is too short', async () => {
      await expectRevert(bytesLib.toUint32BE.call('0x01', 0));
      await expectRevert(bytesLib.toUint32BE.call('0x0000051a', 2));
      await expectRevert(bytesLib.toUint64BE.call('0x01', 0));
      await expectRevert(bytesLib.toUint64BE.call('0xbcd1234000000000', 4));
      await expectRevert(bytesLib.toUintBE.call('0xbcd1234000000000000000000000000000000000000000000000000000000000',
        8));
    });
  });
});
