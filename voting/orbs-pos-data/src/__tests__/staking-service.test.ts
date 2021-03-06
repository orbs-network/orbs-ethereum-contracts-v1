/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { StakingService } from '..';
import IStakingContractABI from 'orbs-staking-contract/build/abi/IStakingContract.json';
import { STAKING_CONTRACT_ADDRESS } from '../contracts-adresses';

class Web3Mock {
  methodParams = (methodName: string) => this.eth.Contract.mock.results[0].value.methods[methodName].mock.calls[0];
  optionValue = (optionName: string) => this.eth.Contract.mock.results[0].value.options[optionName];
  getStakeBalanceOfResult: bigint = null;
  getTotalStakedTokensResult: bigint = null;
  latestInstance: any = null;
  getUnstakeStatusResult: { cooldownAmount: bigint; cooldownEndTime: number } = null;

  eth = {
    Contract: jest.fn().mockImplementation((abi, address) => {
      this.latestInstance = {
        methods: {
          stake: jest.fn(amount => ({ send: jest.fn() })),
          unstake: jest.fn(amount => ({ send: jest.fn() })),
          restake: jest.fn(() => ({ send: jest.fn() })),
          withdraw: jest.fn(() => ({ send: jest.fn() })),
          getStakeBalanceOf: jest.fn(stakeOwner => ({
            call: jest.fn(() => this.getStakeBalanceOfResult),
          })),
          getTotalStakedTokens: jest.fn(() => ({
            call: jest.fn(() => this.getTotalStakedTokensResult),
          })),
          getUnstakeStatus: jest.fn(stakeOwner => ({
            call: jest.fn(() => this.getUnstakeStatusResult),
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

describe('Staking service', () => {
  let stakingService: StakingService;
  let web3Mock: Web3Mock;

  beforeEach(() => {
    web3Mock = new Web3Mock();
    stakingService = new StakingService(web3Mock as any);
  });

  it('should set the default "from" address', async () => {
    const accountAddress = '0xbDBE6E5030f3e769FaC89AEF5ac34EbE8Cf95a76';
    stakingService.setFromAccount(accountAddress);

    expect(web3Mock.optionValue('from')).toEqual(accountAddress);
  });

  it('should initialize the contract with the right abi and the contract address', async () => {
    expect(web3Mock.eth.Contract).toBeCalledWith(IStakingContractABI, STAKING_CONTRACT_ADDRESS);
  });

  it('should expose the deployed contract address as default', async () => {
    expect(stakingService.getStakingContractAddress()).toBe(STAKING_CONTRACT_ADDRESS);
  });

  it('should allow overriding of contract address + expose it as the contract address', async () => {
    const contractAddress = '0xaaaaaE5030f3e769FaC89AEF5ac34EbE8Cf95a76';
    const localWeb3Mock = new Web3Mock();
    const localStakingService = new StakingService(localWeb3Mock as any, contractAddress);

    expect(localWeb3Mock.eth.Contract).toBeCalledWith(IStakingContractABI, contractAddress);
    expect(localStakingService.getStakingContractAddress()).toBe(contractAddress);
  });

  it('should call "stake" with the amount', async () => {
    const result = await stakingService.stake(BigInt(1_000_000));
    // TODO : O.L : The usage of string is temporal and should be changed to Bigint after web3 update
    expect(web3Mock.methodParams('stake')).toEqual([BigInt(1_000_000).toString()]);
  });

  it('should call "unstake" with the amount', async () => {
    await stakingService.unstake(BigInt(2_000_000));
    // TODO : O.L : The usage of string is temporal and should be changed to Bigint after web3 update
    expect(web3Mock.methodParams('unstake')).toEqual([BigInt(2_000_000).toString()]);
  });

  it('should call "restake"', async () => {
    await stakingService.restake();
    expect(web3Mock.methodParams('restake')).toEqual([]);
  });

  it('should call "withdraw"', async () => {
    await stakingService.withdraw();
    expect(web3Mock.methodParams('withdraw')).toEqual([]);
  });

  it('should call "getStakeBalanceOf" with the owner address', async () => {
    web3Mock.getStakeBalanceOfResult = BigInt(123);
    const actual = await stakingService.readStakeBalanceOf('DUMMY_ADDRESS');

    expect(web3Mock.methodParams('getStakeBalanceOf')).toEqual(['DUMMY_ADDRESS']);
    expect(actual).toEqual(BigInt(123));
  });

  it('should call "getTotalStakedTokens"', async () => {
    web3Mock.getTotalStakedTokensResult = BigInt(123456);
    const actual = await stakingService.readTotalStakedTokens();

    expect(web3Mock.methodParams('getTotalStakedTokens')).toEqual([]);
    expect(actual).toEqual(BigInt(123456));
  });

  it('should call "getUnstakeStatus"', async () => {
    web3Mock.getUnstakeStatusResult = { cooldownAmount: BigInt(123), cooldownEndTime: 456 };
    const actual = await stakingService.readUnstakeStatus('DUMMY_ADDRESS');

    expect(web3Mock.methodParams('getUnstakeStatus')).toEqual(['DUMMY_ADDRESS']);
    expect(actual).toEqual({ cooldownAmount: BigInt(123), cooldownEndTime: 456 });
  });

  it('should set options.from address to the given address', async () => {
    expect(web3Mock.latestInstance.options.from).toBeUndefined;
    await stakingService.setFromAccount('DUMMY_ADDRESS');
    expect(web3Mock.latestInstance.options.from).toEqual('DUMMY_ADDRESS');
  });
});
