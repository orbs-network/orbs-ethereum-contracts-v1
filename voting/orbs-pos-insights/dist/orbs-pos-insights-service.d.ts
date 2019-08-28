/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { EthereumClientService, IRewardsDistributionEvent } from "./ethereum-client";
import { OrbsClientService } from "./orbs-client";
export interface IRewards {
    delegatorReward: number;
    guardianReward: number;
    validatorReward: number;
    totalReward: number;
}
export interface IValidatorInfo {
    name: string;
    ipAddress: string;
    website: string;
    orbsAddress: string;
    votesAgainst: number;
}
export interface IElectedValidatorInfo {
    name: string;
    ipAddress: string;
    website: string;
    orbsAddress: string;
    stake: number;
}
export interface IGuardianInfo {
    name: string;
    website: string;
    hasEligibleVote: boolean;
    voted: boolean;
    stake: number;
}
export interface IDelegationInfo {
    delegatedTo: string;
    delegationType: "Transfer" | "Delegate";
    delegatorBalance: number;
    delegationBlockNumber?: number;
    delegationTimestamp?: number;
}
export declare class OrbsPOSInsightsService {
    private ethereumClient;
    private orbsClientService;
    constructor(ethereumClient: EthereumClientService, orbsClientService: OrbsClientService);
    getValidators(): Promise<string[]>;
    getValidatorInfo(address: string): Promise<IValidatorInfo>;
    getTotalStake(): Promise<number>;
    getRewards(address: string): Promise<IRewards>;
    getRewardsHistory(address: string): Promise<IRewardsDistributionEvent[]>;
    getGuardiansList(offset: number, limit: number): Promise<string[]>;
    getGuardianInfo(address: string): Promise<IGuardianInfo>;
    getNextElectionsBlockHeight(): Promise<number>;
    getPastElectionBlockHeight(): Promise<number>;
    getDelegationStatus(address: string): Promise<string>;
    getDelegationInfo(address: string): Promise<IDelegationInfo>;
    getElectedValidators(): Promise<string[]>;
    getElectedValidatorInfo(address: string): Promise<IElectedValidatorInfo>;
}
