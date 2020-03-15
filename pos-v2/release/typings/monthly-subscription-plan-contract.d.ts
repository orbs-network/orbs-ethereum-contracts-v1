import {TransactionConfig, TransactionReceipt} from "web3-core";
import {Contract} from "../eth";
import * as BN from "bn.js";

export interface MonthlySubscriptionPlanContract extends Contract {
  createVC(payment: number | BN, deploymentSubset: string, params?: TransactionConfig): Promise<TransactionReceipt>;
  extendSubscription(vcid: number | BN,payment: number | BN, params?: TransactionConfig): Promise<TransactionReceipt>;
  setContractRegistry(contractRegistry: string, params?: TransactionConfig): Promise<TransactionReceipt>;
}
