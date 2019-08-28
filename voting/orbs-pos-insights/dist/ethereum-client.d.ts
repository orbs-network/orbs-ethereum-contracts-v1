/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
export declare const NON_DELEGATED = "0x0000000000000000000000000000000000000000";
export interface IValidatorData {
    name: string;
    ipAddress: string;
    website: string;
    orbsAddress: string;
}
export interface IGuardianData {
    name: string;
    website: string;
    hasEligibleVote: boolean;
}
export interface IRewardsDistributionEvent {
    distributionEvent: string;
    amount: number;
    transactionHash: string;
}
export interface IDelegationData {
    delegatedTo: string;
    delegationBlockNumber?: number;
    delegationTimestamp?: number;
}
export declare class EthereumClientService {
    private web3;
    private guardiansContract;
    private votingContract;
    private orbsRewardsDistributionContract;
    private validatorsContract;
    private validatorsRegistryContract;
    private erc20Contract;
    constructor(url: string);
    getValidators(): Promise<string[]>;
    getValidatorData(address: string): Promise<IValidatorData>;
    getGuardians(offset: number, limit: number): Promise<string[]>;
    getGuardianData(address: string): Promise<IGuardianData>;
    getCurrentDelegationByDelegate(address: string): Promise<IDelegationData>;
    getOrbsRewardsDistribution(address: string): Promise<IRewardsDistributionEvent[]>;
    getCurrentDelegationByTransfer(address: string): Promise<IDelegationData>;
    getNextElectionsBlockHeight(): Promise<number>;
    getOrbsBalance(address: string): Promise<string>;
}
