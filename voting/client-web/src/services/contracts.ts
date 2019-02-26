import Web3 from 'web3';
import { validatorsContractAddress } from '../consts';
import validatorsAbiJson from '../contracts/OrbsValidators.json';

const web3 = new Web3(ethereum as any);

export const validatorsContractFactory = () => {
  return new web3.eth.Contract(
    validatorsAbiJson.abi as any,
    validatorsContractAddress
  );
};
