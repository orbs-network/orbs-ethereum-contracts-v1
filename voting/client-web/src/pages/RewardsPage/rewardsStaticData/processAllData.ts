import fs from 'fs';
import { TCompleteAddressInfoForRewardsPageWithAddress, TStakingInfo } from '../rewardsPageHooks';
import { IGuardianInfo, IRewardsDistributionEvent } from 'orbs-pos-data';
import { TCurrentDelegationInfo, TRewardsSummary } from '../../../services/IRemoteService';
import _ from 'lodash';
import { IDelegationInfo } from 'orbs-pos-data/dist/interfaces/IDelegationInfo';

const OUTPUT_DIR = './staticDataToUse/';

// DEV_NOTE : The data the we have read after the elections has  missing data due to Guardians leaving,
const fileForDistributionHistory = './processedOutput/allAddressesDataAfterLastElections.json';
const fileForSnapshotData = './processedOutput/allAddressesDataSnapshot.json';

const isRunningForOnlyDistributionHistory = false;

function main() {
  // const allDataArray: TCompleteAddressInfoForRewardsPageWithAddress[] = JSON.parse(fs.readFileSync(fileForDistributionHistory).toString());
  const allDataArray: TCompleteAddressInfoForRewardsPageWithAddress[] = JSON.parse(fs.readFileSync(isRunningForOnlyDistributionHistory ? fileForDistributionHistory : fileForSnapshotData).toString());

  const addresses = allDataArray.map(data => data.address);
  const addressesSet = new Set(addresses);

  // DEV_NOTE : Basic sanity check
  if (allDataArray.length !== addresses.length || allDataArray.length != addressesSet.size) {
    console.log(allDataArray.length);
    console.log(addresses.length);
    console.log(addressesSet.size);
    throw new Error(`There are ${allDataArray.length} data entries but ${addressesSet.size} unique addresses`);
  }

  // Keep each field separately
  const hasActiveDelegationSet: Set<string> = new Set<string>();
  const delegatingToValidGuardianSet: Set<string> = new Set<string>();
  const nonEmptyGuardianInfoMap: Map<string, IGuardianInfo> = new Map<string, IGuardianInfo>();
  const nonEmptyDelegatorInfoMap: Map<string, TCurrentDelegationInfo> = new Map<string, TCurrentDelegationInfo>();
  const nonEmptyStakingInfoMap: Map<string, TStakingInfo> = new Map<string, TStakingInfo>();
  const nonEmptyRewardsSummaryMap: Map<string, TRewardsSummary> = new Map<string, TRewardsSummary>();
  const nonEmptyDistributionHistoryMap: Map<string, IRewardsDistributionEvent[]> = new Map<string, IRewardsDistributionEvent[]>();

  for (let addressAndData of allDataArray) {
    const address = addressAndData.address;

    // Has active delegation
    if (addressAndData.hasActiveDelegation) {
      hasActiveDelegationSet.add(address);
    }

    // Delegating to valid guardian
    if (addressAndData.delegatingToValidGuardian) {
      delegatingToValidGuardianSet.add(address);
    }

    // Guardian info
    if (!_.isEqual(addressAndData.guardianInfo, EMPTY_GUARDIAN_INFO) && addressAndData.guardianInfo !== undefined) {
      nonEmptyGuardianInfoMap.set(address, addressAndData.guardianInfo);
    }

    // Delegator info
    if (!_.isEqual(addressAndData.delegatorInfo, EMPTY_DELEGATOR_INFO) && addressAndData.delegatorInfo !== undefined) {
      nonEmptyDelegatorInfoMap.set(address, addressAndData.delegatorInfo);
    }

    // Staking info
    if (!_.isEqual(addressAndData.stakingInfo, EMPTY_STAKING_INFO) && addressAndData.stakingInfo !== undefined) {
      nonEmptyStakingInfoMap.set(address, addressAndData.stakingInfo);
    }

    // Rewards summaryy
    if (!_.isEqual(addressAndData.rewardsSummary, EMPTY_REWARDS_SUMMARY) && addressAndData.rewardsSummary !== undefined) {
      nonEmptyRewardsSummaryMap.set(address, addressAndData.rewardsSummary);
    }

    // Diostribution history
    if (!_.isEqual(addressAndData.distributionsHistory, EMPTY_DISTRIBUTION_HISTORY) && addressAndData.distributionsHistory !== undefined) {
      nonEmptyDistributionHistoryMap.set(address, addressAndData.distributionsHistory);
    }
  }

  // console.log(`NonEmptyGuardianInfo size ${nonEmptyGuardianInfoMap.size}`)
  // console.log(`Object from entreies ${JSON.stringify(Object.fromEntries(nonEmptyGuardianInfoMap.entries()))}`);

  if (isRunningForOnlyDistributionHistory) {
    fs.writeFileSync(OUTPUT_DIR + 'distributionHistoryMap.json', JSON.stringify(Object.fromEntries(nonEmptyDistributionHistoryMap.entries())));
  } else {
    fs.writeFileSync(OUTPUT_DIR + 'hasActiveDelegationSet.json', JSON.stringify([...hasActiveDelegationSet.values()]));
    fs.writeFileSync(OUTPUT_DIR + 'delegatingToValidGuardianSet.json', JSON.stringify([...delegatingToValidGuardianSet.values()]));
    fs.writeFileSync(OUTPUT_DIR + 'guardianInfoMap.json', JSON.stringify(Object.fromEntries(nonEmptyGuardianInfoMap.entries())));
    fs.writeFileSync(OUTPUT_DIR + 'delegatorInfoMap.json', JSON.stringify(Object.fromEntries(nonEmptyDelegatorInfoMap.entries())));
    fs.writeFileSync(OUTPUT_DIR + 'stakingInfoMap.json', JSON.stringify(Object.fromEntries(nonEmptyStakingInfoMap.entries())));
    fs.writeFileSync(OUTPUT_DIR + 'rewardsSummaryMap.json', JSON.stringify(Object.fromEntries(nonEmptyRewardsSummaryMap.entries())));
  }
}

const EMPTY_GUARDIAN_INFO: IGuardianInfo = {
  'website': '',
  'hasEligibleVote': false,
  'name': '',
  'stakePercent': 0,
  'voted': false,
};

const EMPTY_DELEGATOR_INFO = {
  'delegatorBalance': 0,
  'delegationType': 'Not-Delegated',
  'delegatedTo': '0x0000000000000000000000000000000000000000',
};

const EMPTY_STAKING_INFO = {
  'stakedOrbs': 0,
};

const EMPTY_REWARDS_SUMMARY: TRewardsSummary = {
  "delegatorReward": 0,
  "guardianReward": 0,
  "validatorReward": 0
}

const EMPTY_DISTRIBUTION_HISTORY : IRewardsDistributionEvent[] = [];

main();
