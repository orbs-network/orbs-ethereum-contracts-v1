export interface IOrbsClientService {
  readTotalParticipatingTokens(): Promise<bigint>;
  readGuardianVoteWeight(address: string): Promise<bigint>;
  readValidatorVotes(address: string): Promise<bigint>;
  readValidatorStake(address: string): Promise<bigint>;
  readElectedValidators(): Promise<Uint8Array>;
  readParticipationReward(address: string): Promise<bigint>;
  readGuardianReward(address: string): Promise<bigint>;
  readValidatorReward(address: string): Promise<bigint>;
  readEffectiveElectionBlockNumber(): Promise<number>;
}
