import chai from 'chai';

const { expect } = chai;

const StringUtilsWrapper = artifacts.require('./StringUtilsWrapper.sol');

contract('StringUtils', () => {
  let stringUtils;

  beforeEach(async () => {
    stringUtils = await StringUtilsWrapper.new();
  });

  describe('equal', async () => {
    [
      'a',
      '',
      'Hello World!',
      '1212121432353253450004923042304-23-=-=3-12=31-=23-=12=-0sdkjsdjksdjksjkskjsd',
    ].forEach((str) => {
      it(`should equal "${str}" to itself`, async () => {
        expect(await stringUtils.equal(str, str)).to.be.true();
      });
    });

    [
      { str1: 'a', str2: 'b' },
      { str1: 'a', str2: 'A' },
      { str1: 'Hello World!', str2: 'sdsdfsdfssdfsdfsdfsd' },
      { str1: 'Hello World!', str2: 'Hellow World!   ' },
    ].forEach((spec) => {
      it(`should not equal "${spec.str1}" to "${spec.str1}"`, async () => {
        expect(await stringUtils.equal(spec.str1, spec.str2)).to.be.false();
      });
    });
  });
});
