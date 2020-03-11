import {Contract} from "../eth";
import {TransactionConfig, TransactionReceipt} from "web3-core";
import * as BN from "bn.js";

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
  stake(amount: number | BN, params?: TransactionConfig): Promise<TransactionReceipt>;
  unstake(amount: number | BN, params?: TransactionConfig): Promise<TransactionReceipt>;
  restake(params?: TransactionConfig): Promise<TransactionReceipt>;
  getStakeBalanceOf(stakeOwner: string, params?: TransactionConfig): Promise<BN>; // view
}
