/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

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

  async getLastVote() {
    const from = await this.enableMetamask();
    return this.votingContract.methods.getCurrentVote(from).call({ from });
  }
}
