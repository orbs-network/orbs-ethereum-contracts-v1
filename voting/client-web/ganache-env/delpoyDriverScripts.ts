/* eslint-disable prettier/prettier */
// import { log, TestkitDriver } from 'rewards-v2/dist/e2e/driver';

// import { log, TestkitDriver } from "rewards-v2/dist/e2e/driver";

import { toWei } from 'web3-utils';
import { Driver as OrbsV2Driver } from '@orbs-network/orbs-ethereum-contracts-v2';
import { writeFileSync } from 'fs';
import { Participant } from '@orbs-network/orbs-ethereum-contracts-v2/release/test/driver';

const co = require('@orbs-network/orbs-ethereum-contracts-v2');
const BN = require('bn.js');

const deployDriverScripts = async () => {
  try {
    console.log('deploying Orbs PoS V2 contracts');
    const driver = await OrbsV2Driver.new({ maxCommitteeSize: 22 });
    console.log('After deploying Orbs PoS V2 contracts');

    const orbsV2Account = driver.accounts[0];
    const orbsV2AccountSecond = driver.accounts[1];
    console.log(`Assigning ORBS to ${orbsV2Account}`);
    await driver.erc20.assign(orbsV2Account, new BN('1000000000000000000000000000'));
    await driver.erc20.assign(orbsV2AccountSecond, new BN('1000000000000000000000000000'));
    console.log(`Balance of ${orbsV2Account} `, await driver.erc20.balanceOf(orbsV2Account));

    // Setting delegators staking rewards
    const rewardsInWeiBN = toWei(new BN(5_000));
    await driver.erc20.approve(driver.stakingRewards.address, rewardsInWeiBN);
    await driver.stakingRewards.acceptRewardsBalanceMigration([orbsV2Account], [0], [rewardsInWeiBN], rewardsInWeiBN, {
      from: orbsV2Account,
    });

    // set rewards
    await driver.stakingRewards.setAnnualStakingRewardsRate(12000, toWei(new BN(80_000_000)), {
      from: driver.functionalManager.address,
    });

    const addresses = {
      staking: driver.staking.address,
      erc20: driver.erc20.address,
      guardians: driver.guardiansRegistration.address,
      stakingRewards: driver.stakingRewards.address,
      delegations: driver.delegations.address,
      committee: driver.committee.address,
    };

    console.log('Saving addresses to file');
    writeFileSync('./_out/addresses.json', JSON.stringify(addresses, null, 2));
    writeFileSync('../src/local/addresses.json', JSON.stringify(addresses, null, 2));

    // Create a committee
    const committee: Array<Participant> = [];
    for (let i = 0; i < 4; i++) {
      const { v } = await driver.newGuardian(toWei(new BN(10_000_000)), false, false, true);
      committee[i] = v;
      console.log('Committee member:', committee[i].address);
    }
    // delegate to committee member 0
    await driver.delegations.delegate(committee[0].address, { from: orbsV2Account });
  } catch (e) {
    console.log('error');
    console.error(e);
  }
};

deployDriverScripts()
  .then(() => {
    console.log('script done');
  })
  .catch((e) => console.log('Script error'))
  .finally(() => {
    console.log('Finally');
    process.exit();
  });

export {};
