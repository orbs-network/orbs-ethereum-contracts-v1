import {TransactionConfig, TransactionReceipt} from "web3-core";
import {Contract} from "../eth";
import * as BN from "bn.js";


export interface RewardsContract extends Contract {
  getLastPayedAt(): Promise<string>;
  getOrbsBalance(address: string): Promise<string>;
  getExternalTokenBalance(address: string): Promise<string>;
  assignRewards(params?: TransactionConfig): Promise<TransactionReceipt>;
  distributeOrbsTokenRewards(addrs: string[], amounts: (number | BN)[], params?: TransactionConfig): Promise<TransactionReceipt>;
  setFixedPoolMonthlyRate(rate: number | BN, params?: TransactionConfig): Promise<TransactionReceipt>;
  setProRataPoolMonthlyRate(rate: number | BN, params?: TransactionConfig): Promise<TransactionReceipt>;
  topUpFixedPool(amount: number | BN, params?: TransactionConfig): Promise<TransactionReceipt>;
  topUpProRataPool(amount: number | BN, params?: TransactionConfig): Promise<TransactionReceipt>;
  withdrawExternalTokenRewards( params?: TransactionConfig): Promise<TransactionReceipt>;
  setContractRegistry(contractRegistry: string, params?: TransactionConfig): Promise<TransactionReceipt>;
}
