type address = string;
type url = string;

export enum Mode {
  ReadOnly,
  ReadWrite
}

export interface IApiStrategy {
  mode: Mode;
  getCurrentAddress(): Promise<address>;
  delegate(guardianAddress: address): Promise<{}>;
  voteOut(validatorAddresses: address[]): Promise<{}>;
  getGuardians(): Promise<address[]>;
  getGuardianData(address: address): Promise<{ name: string; website: url }>;
  registerGuardian(info: { name: string; website: url }): Promise<{}>;
  getValidators(): Promise<address[]>;
  getElectedValidators(): Promise<string[]>;
  getElectedValidatorData(address: string): Promise<{}>;
  getValidatorData(address: address): Promise<{ name: string; website: url }>;
  registerValidator(info: {
    name: string;
    ipAddress: string;
    website: url;
    orbsAddress: address;
  }): Promise<{}>;
  getRewards(address: string): Promise<any>;
  getTotalStake(): Promise<string>;
  getCurrentDelegation(address: address): Promise<address>;
  getLastVote(): Promise<{ validators: string[] }>;
  getNextElectionBlockHeight(): Promise<string>;
  isMainNet(): boolean;
}
