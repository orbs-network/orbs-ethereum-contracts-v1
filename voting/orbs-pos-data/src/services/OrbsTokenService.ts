/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import * as ERC20ContractABI from 'orbs-staking-contract/build/abi/ERC20.json';
import Web3 from 'web3';
import { PromiEvent, TransactionReceipt } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
import { MainnetContractsAddresses } from '../contracts-adresses';
import { IOrbsTokenService } from '../interfaces/IOrbsTokenService';

export class OrbsTokenService implements IOrbsTokenService {
  private erc20TokenContract: Contract;

  constructor(private web3: Web3, address: string = MainnetContractsAddresses.erc20Contract) {
    this.erc20TokenContract = new this.web3.eth.Contract(ERC20ContractABI as AbiItem[], address);
  }

  // CONFIG //
  setFromAccount(address: string): this {
    this.erc20TokenContract.options.from = address;
    return this;
  }

  // READ //
  async getAllowance(ownerAddress: string, spenderAddress: string): Promise<string> {
    const balance = await this.erc20TokenContract.methods.allowance(ownerAddress, spenderAddress).call();
    return this.web3.utils.fromWei(balance, 'ether');
  }

  // WRITE //
  approve(spenderAddress: string, amount: number): PromiEvent<TransactionReceipt> {
    return this.erc20TokenContract.methods.approve(spenderAddress, amount);
  }
}
