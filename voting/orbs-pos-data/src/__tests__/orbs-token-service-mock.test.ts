/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { OrbsTokenServiceMock } from '../testkit';
import { IOrbsTokenService } from '../interfaces/IOrbsTokenService';
import { testTxCreatingForServiceMock } from './testUtils/txCreatingMethodTests';

// TODO : O.L : Maybe make the general 'tx mocking' shared with the 'staking-service-mock.
describe(`Orbs Token service mock`, () => {
  testTxCreatingMethods();
  testDataReadingMethods();
});

function testTxCreatingMethods() {
  const serviceMockBuilder = () => new OrbsTokenServiceMock(false);

  describe(`Tx creating methods`, () => {
    testTxCreatingForServiceMock(serviceMockBuilder, 'approve', serviceMock =>
      serviceMock.approve('spenderAddress', 1_000_000),
    );
  });
}

function testDataReadingMethods() {
  describe(`Data reading methods`, () => {
    let orbsTokenServiceMock: OrbsTokenServiceMock;
    let orbsTokenServiceApi: IOrbsTokenService;

    beforeEach(() => {
      orbsTokenServiceMock = new OrbsTokenServiceMock(false);
      orbsTokenServiceApi = orbsTokenServiceMock;
    });

    it(`should allow to set and get allowance`, async () => {
      const ownerAddress = 'OWNER_ADDRESS';
      const spenderAddress = 'SPENDER_ADDRESS';
      const allowanceAmount = '2000';

      const valueBefore = await orbsTokenServiceApi.readAllowance(ownerAddress, spenderAddress);
      expect(valueBefore).toEqual('0');

      orbsTokenServiceMock.setAllowance(ownerAddress, spenderAddress, allowanceAmount);

      const valueAfter = await orbsTokenServiceApi.readAllowance(ownerAddress, spenderAddress);
      expect(valueAfter).toEqual(allowanceAmount);
    });
  });
}
