import TransactionDetails = Truffle.TransactionDetails;
import TransactionResponse = Truffle.TransactionResponse;
import { Contract } from "./contract";

export interface ERC20Contract extends Contract {
  assign( to: string, amount: number | BN, params?: TransactionDetails): Promise<TransactionResponse>;
  approve(address: string, firstPayment: number | BN,params?: TransactionDetails): Promise<TransactionResponse>;
  balanceOf(address: string, params?: TransactionDetails): Promise<string>;
}
