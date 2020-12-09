import { IStakingRewardsService } from '@orbs-network/contracts-js';
import { Guardian } from './orbsNodeService/systemState';
import { useEffect, useState } from 'react';

export function useGuardiansDelegatorsCut(
  guardians: Guardian[],
  stakingRewardsService: IStakingRewardsService,
): { [address: string]: number } {
  const [guardianAddressToDelegatorsCut, setGuardianAddressToDelegatorsCut] = useState<{ [address: string]: number }>(
    {},
  );

  useEffect(() => {
    async function read() {
      const addressTodelegatorsCut: { [address: string]: number } = {};
      // const contractRewardsSettings = await stakingRewardsService.readContractRewardsSettings();
      // const { defaultDelegatorsStakingRewardsPercent } = contractRewardsSettings;

      for (const guardian of guardians) {
        const delegatorsCut = await stakingRewardsService.readDelegatorsCutPercentage(guardian.EthAddress);
        addressTodelegatorsCut[guardian.EthAddress] = delegatorsCut;
      }

      return addressTodelegatorsCut;
    }

    read().then((obj) => {
      setGuardianAddressToDelegatorsCut(obj);
    }).catch(e => console.error(`Failed reading delegators share : ${e}`));
  }, [guardians, stakingRewardsService]);

  return guardianAddressToDelegatorsCut;
}