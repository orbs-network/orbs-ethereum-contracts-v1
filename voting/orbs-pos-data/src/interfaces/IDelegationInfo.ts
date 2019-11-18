export type TDelegationType = "Not-Delegated" | "Transfer" | "Delegate";

export interface IDelegationInfo {
  delegatedTo: string;
  delegationType: TDelegationType;
  delegatorBalance: number;
  delegationBlockNumber?: number;
  delegationTimestamp?: number;
}
