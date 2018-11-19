import chai from 'chai';
import dirtyChai from 'dirty-chai';

import expectRevert from './helpers/expectRevert';

const { expect } = chai;
chai.use(dirtyChai);

const BytesLibExWrapper = artifacts.require('./BytesLibExWrapper.sol');

contract.only('BytesLibEx', () => {
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
});
