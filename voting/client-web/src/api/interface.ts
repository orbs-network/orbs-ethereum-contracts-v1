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
  registerGuardian(name: string, website: url): Promise<{}>;
  getValidators(): Promise<address[]>;
  getElectedValidators(): Promise<any[]>;
  getValidatorData(address: address): Promise<{ name: string; website: url }>;
  registerValidator(
    name: string,
    ipAddress: string,
    website: url,
    orbsAddress: address
  ): Promise<{}>;
}
