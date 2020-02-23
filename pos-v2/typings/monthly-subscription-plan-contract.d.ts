import TransactionDetails = Truffle.TransactionDetails;
import TransactionResponse = Truffle.TransactionResponse;
import { Contract } from "./contract";

export interface MonthlySubscriptionPlanContract extends Contract {
  createVC(payment: number | BN, deploymentSubset: string, params?: TransactionDetails): Promise<TransactionResponse>;
  extendSubscription(vcid: number | BN,payment: number | BN, params?: TransactionDetails): Promise<TransactionResponse>;
  setContractRegistry(contractRegistry: string, params?: TransactionDetails): Promise<TransactionResponse>;
}
