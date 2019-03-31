import Web3 from 'web3';
import {
  erc20ContractFactory,
  votingContractFactory,
  guardiansContractFactory,
  validatorsRegistryContractFactory
} from './contracts';
import { Address4 } from 'ip-address';

export class MetamaskService {
  private web3: Web3;
  private validatorsRegistryContract;
  private guardiansContract;
  private votingContract;
  private erc20Contract;

  constructor() {
    this.web3 = new Web3(ethereum as any);
    this.validatorsRegistryContract = validatorsRegistryContractFactory(
      this.web3
    );
    this.guardiansContract = guardiansContractFactory(this.web3);
    this.votingContract = votingContractFactory(this.web3);
    this.erc20Contract = erc20ContractFactory(this.web3);
  }

  private ipAddressToBytes(address: string) {
    const formatted = new Address4(address).toHex();
    return `0x${formatted.split(':').join('')}`;
  }

  private enableMetamask(): Promise<string> {
    return ethereum
      .enable()
      .then(
        (addresses: string[]) => addresses[0],
        (err: any) => Promise.reject(err)
      );
  }

  isMainNet() {
    return ethereum['networkVersion'] === '1';
  }

  getCurrentAddress() {
    return this.enableMetamask();
  }

  async delegate(candidate: string) {
    const from = await this.enableMetamask();
    return this.votingContract.methods.delegate(candidate).send({ from });
  }

  async voteOut(validators: string[]) {
    const from = await this.enableMetamask();
    return this.votingContract.methods.voteOut(validators).send({ from });
  }

  async registerGuardian(info) {
    const { name, website } = info;
    const from = await this.enableMetamask();
    const requiredDeposit = await this.guardiansContract.methods
      .registrationDepositWei()
      .call();
    const isGuardian = await this.guardiansContract.methods
      .isGuardian(from)
      .call({ from });
    const method = isGuardian ? 'update' : 'register';
    return this.guardiansContract.methods[method](name, website).send({
      from,
      value: requiredDeposit
    });
  }

  async registerValidator(info) {
    const { name, ipAddress, website, orbsAddress } = info;
    const from = await this.enableMetamask();
    const ipHex = this.ipAddressToBytes(ipAddress);
    const isValidator = await this.validatorsRegistryContract.methods
      .isValidator(from)
      .call({ from });
    const method = isValidator ? 'update' : 'register';
    return this.validatorsRegistryContract.methods[method](
      name,
      ipHex,
      website,
      orbsAddress
    ).send({ from });
  }

  async getCurrentDelegation(): Promise<string> {
    const from = await this.enableMetamask();

    const OrbsTDEEthereumBlock = 7439168;
    const TransferEventSignature = this.web3.utils.sha3(
      'Transfer(address,address,uint256)'
    );
    const delegationConstant =
      '0x00000000000000000000000000000000000000000000000000f8b0a10e470000';

    let currentDelegation = await this.votingContract.methods
      .getCurrentDelegation(from)
      .call({ from });

    if (currentDelegation === '0x0000000000000000000000000000000000000000') {
      const paddedAddress = this.web3.utils.padLeft(from, 64);
      const options = {
        fromBlock: OrbsTDEEthereumBlock,
        toBlock: 'latest',
        topics: [paddedAddress]
      };
      const events = await this.erc20Contract.getPastEvents(
        TransferEventSignature,
        options
      );
      const entryWithTransaction = events.find(
        ({ raw }) => raw['data'] === delegationConstant
      );
      if (entryWithTransaction) {
        const help = entryWithTransaction['raw']['topics'][2];
        currentDelegation = '0x' + help.substring(26, 66);
      }
    }
    return currentDelegation;
  }

  async getLastVote() {
    const from = await this.enableMetamask();
    return this.votingContract.methods.getCurrentVote(from).call({ from });
  }
}
