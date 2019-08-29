/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
import { Argument } from 'orbs-client-sdk';
export declare class OrbsClientService {
    private orbsClient;
    private orbsAccount;
    constructor(nodeAddress: string, virtualChainId: number);
    buildQuery(methodName: string, args: Argument[]): Uint8Array;
    sendQuery<T extends string | number | bigint | Uint8Array>(query: Uint8Array): Promise<T>;
    getTotalStake(): Promise<bigint>;
    getGuardianVoteWeight(address: string): Promise<bigint>;
    getValidatorVotes(address: string): Promise<bigint>;
    getValidatorStake(address: string): Promise<bigint>;
    getElectedValidators(): Promise<Uint8Array>;
    getParticipationReward(address: string): Promise<bigint>;
    getGuardianReward(address: string): Promise<bigint>;
    getValidatorReward(address: string): Promise<bigint>;
    getEffectiveElectionBlockNumber(): Promise<number>;
}
