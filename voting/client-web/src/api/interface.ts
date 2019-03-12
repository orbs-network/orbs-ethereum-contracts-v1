type address = string;
type url = string;

export enum Strategies {
  remote,
  metamask
}

export interface IApiStrategy {
  type: Strategies;
  getCurrentAddress?(): Promise<address>;
  delegate?(guardianAddress: address): Promise<{}>;
  voteOut?(validatorAddresses: address[]): Promise<{}>;
  getGuardians(offset: number, limit: number): Promise<address[]>;
  getGuardianData(address: address): Promise<{ name: string; website: url }>;
  registerGuardian?(name: string, website: url): Promise<{}>;
  getValidators(): Promise<address[]>;
  getValidatorData(address: address): Promise<{ name: string; website: url }>;
  registerValidator?(
    name: string,
    ipAddress: string,
    website: url,
    orbsAddress: address
  ): Promise<{}>;
}
