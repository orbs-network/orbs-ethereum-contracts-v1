import { erc20Abi } from '../constants/erc20-abi';
import * as contractsInfo from '../contracts-info';
import votingContractJson from '../contracts/OrbsVoting.json';
import guardiansContractJson from '../contracts/OrbsGuardians.json';
import validatorsContractJson from '../contracts/OrbsValidators.json';
import validatorsRegistryContractJson from '../contracts/OrbsValidatorsRegistry.json';

export const validatorsContractFactory = web3 => {
  return new web3.eth.Contract(
    validatorsContractJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsValidators']['address']
      : contractsInfo.EthereumValidatorsContract.address,
  );
};

export const validatorsRegistryContractFactory = web3 => {
  return new web3.eth.Contract(
    validatorsRegistryContractJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsValidatorsRegistry']['address']
      : contractsInfo.EthereumValidatorsRegistryContract.address,
  );
};

export const guardiansContractFactory = web3 => {
  return new web3.eth.Contract(
    guardiansContractJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsGuardians']['address']
      : contractsInfo.EthereumGuardiansContract.address,
  );
};

export const votingContractFactory = web3 => {
  return new web3.eth.Contract(
    votingContractJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsVoting']['address']
      : contractsInfo.EthereumVotingContract.address,
  );
};

export const erc20ContractFactory = web3 => {
  return new web3.eth.Contract(erc20Abi, contractsInfo.EthereumErc20Address.address);
};
