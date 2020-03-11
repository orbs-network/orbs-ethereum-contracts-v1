import {TransactionConfig, TransactionReceipt} from "web3-core";
import {Contract} from "../eth";
import * as BN from "bn.js";

export interface ERC20Contract extends Contract {
  assign( to: string, amount: number | BN, params?: TransactionConfig): Promise<TransactionReceipt>;
  approve(address: string, firstPayment: number | BN,params?: TransactionConfig): Promise<TransactionReceipt>;
  balanceOf(address: string, params?: TransactionConfig): Promise<string>;
}
