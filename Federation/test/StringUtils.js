/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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
        expect(await stringUtils.equal.call(str, str)).to.be.true();
      });
    });

    [
      { str1: 'a', str2: 'b' },
      { str1: 'a', str2: 'A' },
      { str1: 'Hello World!', str2: 'sdsdfsdfssdfsdfsdfsd' },
      { str1: 'Hello World!', str2: 'Hellow World!   ' },
    ].forEach((spec) => {
      it(`should not equal "${spec.str1}" to "${spec.str1}"`, async () => {
        expect(await stringUtils.equal.call(spec.str1, spec.str2)).to.be.false();
      });
    });
  });
});
