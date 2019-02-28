import Web3 from 'web3';
import OrbsContractsInfo from './contracts-info';
import validatorsAbiJson from '../contracts/OrbsValidators.json';

const web3 = new Web3(ethereum as any);

export const validatorsContractFactory = () => {
  return new web3.eth.Contract(
    validatorsAbiJson.abi as any,
    window['__OrbsContractsInfo__']
      ? window['__OrbsContractsInfo__']['OrbsValidators']['address']
      : OrbsContractsInfo.OrbsValidators.address
  );
};
