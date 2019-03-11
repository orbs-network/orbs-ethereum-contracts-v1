import * as OrbsContractsInfo from '../contracts-info';
import votingAbiJson from '../contracts/OrbsVoting.json';
import guardiansAbiJson from '../contracts/OrbsGuardians.json';
import validatorsAbiJson from '../contracts/OrbsValidators.json';
import validatorsRegistryAbiJson from '../contracts/OrbsValidatorsRegistry.json';

export const validatorsContractFactory = web3 => {
  return new web3.eth.Contract(
    validatorsAbiJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsValidators']['address']
      : OrbsContractsInfo.OrbsValidators.address
  );
};

export const validatorsRegistryContractFactory = web3 => {
  return new web3.eth.Contract(
    validatorsRegistryAbiJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsValidatorsRegistry']['address']
      : OrbsContractsInfo.OrbsValidatorsRegistry.address
  );
};

export const guardiansContractFactory = web3 => {
  return new web3.eth.Contract(
    guardiansAbiJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsGuardians']['address']
      : OrbsContractsInfo.OrbsGuardians.address
  );
};

export const votingContractFactory = web3 => {
  return new web3.eth.Contract(
    votingAbiJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsVoting']['address']
      : OrbsContractsInfo.OrbsVoting.address
  );
};
