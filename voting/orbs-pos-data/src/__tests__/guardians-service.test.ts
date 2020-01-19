/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { MainnetContractsAddresses } from '../contracts-adresses';
import votingContractJSON from '../contracts/OrbsVoting.json';
import { GuardiansService } from '../services/GuardiansService';
import { OrbsClientServiceMock } from './orbs-client-service-mock';

class Web3Mock {
  methodParams = (methodName: string) => this.eth.Contract.mock.results[0].value.methods[methodName].mock.calls[0];
  optionValue = (optionName: string) => this.eth.Contract.mock.results[0].value.options[optionName];
  getStakeBalanceOfResult: string = null;
  latestInstance: any = null;

  eth = {
    Contract: jest.fn().mockImplementation((abi, address) => {
      this.latestInstance = {
        methods: {
          delegate: jest.fn(amount => ({ send: jest.fn() })),
          getStakeBalanceOf: jest.fn(stakeOwner => ({
            call: jest.fn(() => this.getStakeBalanceOfResult),
          })),
        },
        options: {
          from: '',
        },
      };
      return this.latestInstance;
    }),
  };
}

describe('Guardians service', () => {
  let guardiansService: GuardiansService;
  let orbsClientService: OrbsClientServiceMock;
  let web3Mock: Web3Mock;

  beforeEach(() => {
    web3Mock = new Web3Mock();
    orbsClientService = new OrbsClientServiceMock();
    guardiansService = new GuardiansService(web3Mock as any, orbsClientService, MainnetContractsAddresses);
  });

  it('should set the default "from" address', async () => {
    const accountAddress = '0xbDBE6E5030f3e769FaC89AEF5ac34EbE8Cf95a76';
    guardiansService.setFromAccount(accountAddress);

    expect(web3Mock.optionValue('from')).toEqual(accountAddress);
  });

  it('should initialize the contract with the right abi and the contract address', async () => {
    expect(web3Mock.eth.Contract).toBeCalledWith(votingContractJSON.abi, MainnetContractsAddresses.votingContract);
  });

  it('should call "delegate" with the given guardian address', async () => {
    const result = await guardiansService.selectGuardian('DUMMY_GUARDIAN_ADDRESS');
    expect(web3Mock.methodParams('delegate')).toEqual(['DUMMY_GUARDIAN_ADDRESS']);
  });
});
