/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { OrbsTokenServiceMock } from '../testkit';
import { testTxCreatingForServiceMock } from './testUtils/txCreatingMethodTests';

describe(`Orbs Token service mock`, () => {
  testTxCreatingMethods();
  testDataReadingMethods();
});

function testTxCreatingMethods() {
  describe(`Tx creating methods`, () => {
    testTxCreatingForServiceMock(OrbsTokenServiceMock, 'approve', serviceMock =>
      serviceMock.approve('spenderAddress', 1_000_000n),
    );
  });
}

function testDataReadingMethods() {
  describe(`Data reading methods`, () => {
    let orbsTokenServiceMock: OrbsTokenServiceMock;

    beforeEach(() => {
      orbsTokenServiceMock = new OrbsTokenServiceMock(false);
    });

    it(`should allow to set and get allowance`, async () => {
      const ownerAddress = 'OWNER_ADDRESS';
      const spenderAddress = 'SPENDER_ADDRESS';
      const allowanceAmount = 2_000n;

      const valueBefore = await orbsTokenServiceMock.readAllowance(ownerAddress, spenderAddress);
      expect(valueBefore).toEqual(0n);

      orbsTokenServiceMock.setAllowance(ownerAddress, spenderAddress, allowanceAmount);

      const valueAfter = await orbsTokenServiceMock.readAllowance(ownerAddress, spenderAddress);
      expect(valueAfter).toEqual(allowanceAmount);
    });
  });
}
