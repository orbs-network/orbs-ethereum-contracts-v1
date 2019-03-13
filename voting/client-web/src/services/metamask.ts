import Web3 from 'web3';
import {
  guardiansContractFactory,
  votingContractFactory,
  validatorsRegistryContractFactory
} from './contracts';

export class MetamaskService {
  private web3: Web3;
  private validatorsRegistryContract;
  private guardiansContract;
  private votingContract;
  private metamaskService;

  constructor() {
    this.web3 = new Web3(ethereum as any);
    this.validatorsRegistryContract = validatorsRegistryContractFactory(
      this.web3
    );
    this.guardiansContract = guardiansContractFactory(this.web3);
    this.votingContract = votingContractFactory(this.web3);
  }

  private ipAddressToHex(address: string) {
    return this.web3.utils.toHex(address.split('.').join(''));
  }

  private enableMetamask(): Promise<string> {
    return ethereum
      .enable()
      .then(
        (addresses: string[]) => addresses[0],
        (err: any) => Promise.reject(err)
      );
  }

  getCurrentAddress() {
    return this.enableMetamask();
  }

  async delegate(candidate: string) {
    const from = await this.metamaskService.enable();
    return this.votingContract.methods.delegate(candidate).send({ from });
  }

  async voteOut(validators: string[]) {
    const from = await this.metamaskService.enable();
    return this.votingContract.methods.voteOut(validators).send({ from });
  }

  async registerGuardian(info) {
    const { name, website } = info;
    const from = await this.metamaskService.enable();
    return this.guardiansContract.methods
      .register(name, website)
      .send({ from });
  }

  async registerValidator(info) {
    const { name, ipAddress, website, orbsAddress } = info;
    const from = await this.metamaskService.enable();
    const ipHex = this.ipAddressToHex(ipAddress);
    return this.validatorsRegistryContract.methods
      .register(name, ipHex, website, orbsAddress)
      .send({ from });
  }
}
