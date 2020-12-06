import allAddressesThatEverHeldOrbs from './all_addresses_that_ever_held_orbs.json';
import { readCompleteDataForAddress, TCompleteAddressInfoForRewardsPage } from '../rewardsPageHooks';
// import { buildServices } from '../../../services/Services';
import Web3 from 'web3';
import fs from "fs";
import { IRemoteService } from '../../../services/IRemoteService';
import { RemoteService } from '../../../services/RemoteService';
import { configs } from '../../../config';
// import { MetamaskService } from '../../../services/MetamaskService';
import {
  GuardiansService, IGuardiansService,
  IOrbsClientService,
  IOrbsRewardsService, IStakingService,
  OrbsClientService,
  OrbsRewardsService,
  StakingService,
} from 'orbs-pos-data';
import { BuildOrbsClient } from '../../../services/OrbsClientFactory';
import { chunk } from 'lodash';
import { retry } from 'ts-retry-promise';

const addressThreshold = 1000;

// DEV_NOTE : O.L : This list was taken on December 3rd 2020.
const validGuardians = ["0xf7ae622c77d0580f02bcb2f92380d61e3f6e466c","0xf058ccfb2324310c33e8fd9a1dda8e99c8beda59","0x63aef7616882f488bca97361d1c24f05b4657ae5","0x93b8ce5ec9a8713a1f560e4741ffc5616f7bab61","0xcb6172196bbcf5b4cf9949d7f2e4ee802ef2b81d","0xb8ca9ea80f51307a26f354b462fc226349505dae","0xf257ede1ce68ca4b94e18eae5cb14942cbff7d1c","0xe9e284277648fcdb09b8efc1832c73c09b5ecf59","0xd22ed48ef4533937c204ce8523c8caeddf6b5f05","0xcca877408c68878ea02afd1c441cdaaa05d061f1","0x0874bc1383958e2475df73dc68c4f09658e23777","0xc82ec0f3c834d337c51c9375a1c0a65ce7aadaec","0xa3cbdd66267daaa4b51af6cd894c92054bb2f2c7","0xb0aec752b0ba2635ec15d0e662a5972e0a3035fb","0x9afc8ef233e2793b2b90ca5d70ca2e7098013142"];



async function main() {
  const provider = new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws/v3/3fe9b03bd8374639809addf2164f7287');
  const web3 = new Web3(provider);
  const remoteService: IRemoteService = new RemoteService('https://orbs-voting-proxy-server.herokuapp.com/api');
  // TODO : FUTURE: O.L : This method of signaling no meta-mask is too fragile and unclear, change it to be like staking wallet
  const stakingService = new StakingService(web3, configs?.contractsAddressesOverride?.stakingContract);
  const orbsClient = BuildOrbsClient();
  const orbsClientService: IOrbsClientService = new OrbsClientService(orbsClient);
  const orbsRewardsService: IOrbsRewardsService = new OrbsRewardsService(web3, orbsClientService);
  const guardiansService = new GuardiansService(
    web3,
    orbsClientService,
    configs?.contractsAddressesOverride,
    configs.earliestBlockForDelegationOverride
      ? {
        earliestBlockForDelegation: configs.earliestBlockForDelegationOverride,
      }
      : undefined,
  );

  // const services = buildServices(web3, provider);


  let loopStartsFrom = 305;
  let startIndex = loopStartsFrom;
  let counter = 1;
  let currentDataArray: TCompleteAddressInfoForRewardsPage[] = [];
  let allDataArray: TCompleteAddressInfoForRewardsPage[] = [];
  let allDataJSON: Record<string, TCompleteAddressInfoForRewardsPage> = {};

  const bigIntReplacer = (key, value) =>
    typeof value === 'bigint'
      ? value.toString()
      : value // return everything else unchanged

  let chunks = chunk(allAddressesThatEverHeldOrbs, 50);

  for (let i = loopStartsFrom; i < chunks.length; i++) {
    const addressesChunk = chunks[i];
    const percentage = (i / chunks.length) * 100;
    console.log(`Reading for chunk ${i}/${chunks.length} (${percentage.toFixed(2)}%): ${JSON.stringify(addressesChunk)}`);
    const addresseseData = await readChunk(addressesChunk, orbsRewardsService, remoteService, stakingService, guardiansService, validGuardians);
    counter ++;

    for (let i = 0; i < addressesChunk.length; i++) {
      const address = addressesChunk[i];
      const addressData = addresseseData[i];

      currentDataArray.push(addressData);
      allDataArray.push(addressData);
      allDataJSON[address] = addressData;
    }


    if (counter >= 5 || i == chunks.length - 1) {
      const endIndex = i + 1;
      const fileName = `shard_startIndex_${startIndex}_${endIndex}.json`;
      fs.writeFileSync(`./output/shards/${fileName}`, JSON.stringify(currentDataArray, bigIntReplacer, 2));
      startIndex = endIndex + 1;
      counter = 0;
    }
  }

  console.log('Finished loop !');
  // Writes the whole data files
  // fs.writeFileSync(`./output/allAddressesDataArray.json`, JSON.stringify(allDataArray, bigIntReplacer, 2));
  // fs.writeFileSync(`./output/allAddressesData.json`, JSON.stringify(allDataJSON, bigIntReplacer, 2));
}

async function readChunk(  addresses: string[],
                           orbsRewardsService: IOrbsRewardsService,
                           remoteService: IRemoteService,
                           stakingService: IStakingService,
                           guardiansService: IGuardiansService,
                           validGuardianAddresses: string[],) {
  const promises: Promise<TCompleteAddressInfoForRewardsPage>[] = [];

  for (let address of addresses) {
    const prm = () => readCompleteDataForAddress(address, orbsRewardsService, remoteService, stakingService, guardiansService, validGuardians);
    promises.push(retry(prm, { retries: 5 }));
  }

  return Promise.all(promises);
}

main().catch(e => console.error(e)).then(() => console.log('Done'));