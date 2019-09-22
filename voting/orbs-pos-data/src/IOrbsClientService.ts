export interface IOrbsClientService {
  getTotalParticipatingTokens(): Promise<bigint>;
  getGuardianVoteWeight(address: string): Promise<bigint>;
  getValidatorVotes(address: string): Promise<bigint>;
  getValidatorStake(address: string): Promise<bigint>;
  getElectedValidators(): Promise<Uint8Array>;
  getParticipationReward(address: string): Promise<bigint>;
  getGuardianReward(address: string): Promise<bigint>;
  getValidatorReward(address: string): Promise<bigint>;
  getEffectiveElectionBlockNumber(): Promise<number>;
}
