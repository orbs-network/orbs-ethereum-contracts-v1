import { Contract } from "./contract";

import TransactionResponse = Truffle.TransactionResponse;
import TransactionDetails = Truffle.TransactionDetails;

export interface StakedEvent {
  stakeOwner: string;
  amount: number | BN;
  totalStakedAmount: number | BN;
}

export interface UnstakedEvent {
  stakeOwner: string;
  amount: number | BN;
  totalStakedAmount: number | BN;
}

export interface StakingContract extends Contract {
  stake(amount: number | BN, params?: TransactionDetails): Promise<TransactionResponse>;
  unstake(amount: number | BN, params?: TransactionDetails): Promise<TransactionResponse>;
  restake(params?: TransactionDetails): Promise<TransactionResponse>;
  getStakeBalanceOf(stakeOwner: string, params?: TransactionDetails): Promise<BN>; // view
}
