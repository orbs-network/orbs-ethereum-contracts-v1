import { SystemState } from './systemState';

export interface IReadAndProcessResults {
  systemState: SystemState;
  committeeMembers: ICommitteeMemberData[];
}

export interface ICommitteeMemberData {
  EthAddress: string;
  Weight: number;
  Name: string;
  EnterTime: number;
}
