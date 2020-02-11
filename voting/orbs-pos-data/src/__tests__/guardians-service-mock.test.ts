/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { GuardiansServiceMock, StakingServiceMock } from '../testkit';
import { testTxCreatingForServiceMock } from './testUtils/txCreatingMethodTests';
import { IStakingService } from '../interfaces/IStakingService';

describe(`Guardians service mock`, () => {
  testTxCreatingMethods();
  testImitationOfRealContractLogic();
  testImitationOfRealEventsSubscription();
});

function testTxCreatingMethods() {
  describe(`Tx creating methods`, () => {
    testTxCreatingForServiceMock(GuardiansServiceMock, 'selectGuardian', serviceMock =>
      serviceMock.selectGuardian('DUMMY_GUARDIAN_ADDRESS'),
    );
  });
}

function testImitationOfRealContractLogic() {
  describe(`Effects`, () => {
    it(`should allow to set and get the selected guardian`, async () => {
      const guardiansServiceMock = new GuardiansServiceMock();

      guardiansServiceMock.setFromAccount('SENDER_1_ADDRESS');
      await guardiansServiceMock.selectGuardian('SENDER_1_GUARDIAN_ADDRESS');
      const sender1GuardianAddress = await guardiansServiceMock.readSelectedGuardianAddress('SENDER_1_ADDRESS');

      guardiansServiceMock.setFromAccount('SENDER_2_ADDRESS');
      await guardiansServiceMock.selectGuardian('SENDER_2_GUARDIAN_ADDRESS');
      const sender2GuardianAddress = await guardiansServiceMock.readSelectedGuardianAddress('SENDER_2_ADDRESS');

      expect(sender1GuardianAddress).toEqual('SENDER_1_GUARDIAN_ADDRESS');
      expect(sender2GuardianAddress).toEqual('SENDER_2_GUARDIAN_ADDRESS');
    });
  });
}

function testImitationOfRealEventsSubscription() {
  describe('RealEvents subscription', () => {
    const ownerAddress = '0xowner';
    let guardiansServiceMock = new GuardiansServiceMock();
    let callbackSpy: jest.Mock;

    beforeEach(async () => {
      guardiansServiceMock = new GuardiansServiceMock();
      guardiansServiceMock.setFromAccount(ownerAddress);

      callbackSpy = jest.fn();
    });

    it('Should trigger "Staked" event after staking', async () => {
      const guardianAddress = '0xguardian';
      guardiansServiceMock.subscribeToDelegateEvent(ownerAddress, callbackSpy);

      await guardiansServiceMock.selectGuardian(guardianAddress);

      expect(callbackSpy).toBeCalledTimes(1);
      expect(callbackSpy).toBeCalledWith(null, ownerAddress, guardianAddress, 1);
    });
  });
}
