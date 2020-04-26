/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { OrbsRewardsServiceMock } from '../../../testkit';
import { IRewardsDistributionEvent } from '../../../interfaces/IRewardsDistributionEvent';

describe(`Orbs rewards service mock`, () => {
  testDataReadingMethods();
});

// DEV_NOTE : We are using '.toString()' because Jest has a problem reporting on failed tests with BigInt.

function testDataReadingMethods() {
  describe(`Data reading methods`, () => {
    let orbsRewardsServiceMock: OrbsRewardsServiceMock;
    const ownerAddress = 'OWNER_ADDRESS';

    beforeEach(() => {
      orbsRewardsServiceMock = new OrbsRewardsServiceMock();
    });

    it(`should allow to set and get accumulated rewards + display zero values for as default`, async () => {
      const defaultAccumulatedRewards = await orbsRewardsServiceMock.readAccumulatedRewards(ownerAddress);
      expect(defaultAccumulatedRewards.delegatorReward.toString()).toEqual((0n).toString());
      expect(defaultAccumulatedRewards.guardianReward.toString()).toEqual((0n).toString());
      expect(defaultAccumulatedRewards.validatorReward.toString()).toEqual((0n).toString());

      const accumulatedDelegatorRewards = 100000n;
      const accumulatedGuardianRewards = 200000n;
      const accumulatedValidatorRewards = 200000n;

      orbsRewardsServiceMock.withAccumulatedRewards(ownerAddress, {
        validatorReward: accumulatedValidatorRewards,
        guardianReward: accumulatedGuardianRewards,
        delegatorReward:accumulatedDelegatorRewards,
      });

      const accumulatedRewardsAfter = await orbsRewardsServiceMock.readAccumulatedRewards(ownerAddress);
      expect(accumulatedRewardsAfter.delegatorReward.toString()).toBe(accumulatedDelegatorRewards.toString());
      expect(accumulatedRewardsAfter.guardianReward.toString()).toBe(accumulatedGuardianRewards.toString());
      expect(accumulatedRewardsAfter.validatorReward.toString()).toBe(accumulatedValidatorRewards.toString());
    });

    it(`should allow to set and get rewards distribution history + display zero values for as default`, async () => {
      const defaultDistributionHistory = await orbsRewardsServiceMock.readRewardsDistributionsHistory(ownerAddress);
      expect(defaultDistributionHistory.length).toEqual(0);

      const firstDistributionEvent: IRewardsDistributionEvent = {
        amount: 1000n,
        distributionEvent: 'Dist 1',
        transactionHash: '0xblabla',
      }

      const secondDistributionEvent: IRewardsDistributionEvent = {
        amount: 2000n,
        distributionEvent: 'Dist 2',
        transactionHash: '0xradiogaga',
      }

      orbsRewardsServiceMock.withRewardsDistributionHistory(ownerAddress, [
        firstDistributionEvent,
        secondDistributionEvent,
      ]);

      const distributionHistroyAfter = await orbsRewardsServiceMock.readRewardsDistributionsHistory(ownerAddress);
      expect(distributionHistroyAfter.length).toBe(2);
      expect(distributionHistroyAfter[0].transactionHash).toBe(firstDistributionEvent.transactionHash);
      expect(distributionHistroyAfter[0].distributionEvent).toBe(firstDistributionEvent.distributionEvent);
      expect(distributionHistroyAfter[0].amount.toString()).toBe(firstDistributionEvent.amount.toString());
      expect(distributionHistroyAfter[1].transactionHash).toBe(secondDistributionEvent.transactionHash);
      expect(distributionHistroyAfter[1].distributionEvent).toBe(secondDistributionEvent.distributionEvent);
      expect(distributionHistroyAfter[1].amount.toString()).toBe(secondDistributionEvent.amount.toString());

      // Extra test for safety (In case more properties were added (Bigint&Jest problem))
      expect(distributionHistroyAfter[0]).toBe(firstDistributionEvent);
      expect(distributionHistroyAfter[1]).toBe(secondDistributionEvent);
    });
  });
}
