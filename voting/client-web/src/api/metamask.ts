import Web3 from 'web3';
import {
  validatorsContractFactory,
  guardiansContractFactory,
  votingContractFactory,
  validatorsRegistryContractFactory
} from '../services/contracts';
import MetamaskService from '../services/metamask';
import { IApiStrategy } from './interface';

export default class MetamaskStrategy implements IApiStrategy {
  private web3: Web3;
  private validatorsRegistryContract;
  private validatorsContract;
  private guardiansContract;
  private votingContract;
  private metamaskService;

  constructor() {
    this.web3 = new Web3(ethereum as any);
    this.validatorsContract = validatorsContractFactory(this.web3);
    this.validatorsRegistryContract = validatorsRegistryContractFactory(
      this.web3
    );
    this.guardiansContract = guardiansContractFactory(this.web3);
    this.votingContract = votingContractFactory(this.web3);
    this.metamaskService = new MetamaskService();
  }

  private ipAddressToHex(address: string) {
    return this.web3.utils.toHex(address.split('.').join(''));
  }

  getCurrentAddress() {
    return this.metamaskService.enable();
  }

  async delegate(candidate) {
    const from = await this.metamaskService.enable();
    return this.votingContract.methods.delegate(candidate).send({ from });
  }

  async voteOut(validators) {
    const from = await this.metamaskService.enable();
    return this.votingContract.methods.voteOut(validators).send({ from });
  }

  async getGuardians() {
    const from = await this.metamaskService.enable();
    const offset = 0;
    const limit = 100;
    return this.guardiansContract.methods
      .getGuardians(offset, limit)
      .call({ from });
  }

  async getGuardianData(address) {
    const from = await this.metamaskService.enable();
    return this.guardiansContract.methods
      .getGuardianData(address)
      .call({ from });
  }

  async registerGuardian(name, website) {
    const from = await this.metamaskService.enable();
    return this.guardiansContract.methods
      .register(name, website)
      .send({ from });
  }

  async getValidators() {
    const from = await this.metamaskService.enable();
    return this.validatorsContract.methods.getValidators().call({ from });
  }

  async registerValidator(name, ipAddress, website, orbsAddress) {
    const from = await this.metamaskService.enable();
    const ipHex = this.ipAddressToHex(ipAddress);
    return this.validatorsRegistryContract.methods
      .register(name, ipHex, website, orbsAddress)
      .send({ from });
  }

  async getValidatorData(address) {
    const from = await this.metamaskService.enable();
    return this.validatorsRegistryContract.methods
      .getValidatorData(address)
      .call({ from });
  }
}
