// DEV_NOTE : This file is manually made and represents the properties of the status json
// TODO : ORL : Read it from a shared library.

export interface IManagementStatusResponse {
  Status: string;
  Timestamp: string;
  Payload: {
    Guardians: IGuardianData[];
    CommitteeEvents: ICommitteeEvent[];

    // Current refs
    CurrentRefBlock: number;
    CurrentRefTime: number;

    // DEV_NOTE : O.L : We can add the fields that we need to process
    [key: string]: any;
  };
}

export interface ICommitteeEvent {
  RefTime: number;
  Committee: ICommitteeEventCommitteeMember[];
}

export interface ICommitteeEventCommitteeMember {
  EthAddress: string;
  OrbsAddress: string;
  Weight: number;
  IdentityType: number;
}

export interface IGuardianData {
  EthAddress: string;
  OrbsAddress: string;
  Ip: string;
  EffectiveStake: number;
  SelfStake: number;
  DelegatedStake: number;
  ElectionsStatus: {
    LastUpdateTime: number;
    ReadyToSync: boolean;
    ReadyForCommittee: boolean;
    TimeToStale: number;
  };
  Name: string;
  Website: string;
  Contact: string;
  Metadata: object;
  RegistrationTime: number;

  // DEV_NOTE : O.L : I have not seen this field in the response, I took it from Noam's code
  IdentityType?: number;
}
