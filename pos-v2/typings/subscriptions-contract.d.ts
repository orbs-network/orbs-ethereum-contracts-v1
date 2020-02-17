import { Contract } from "web3-eth-contract";

import TransactionResponse = Truffle.TransactionResponse;
import ContractInstance = Truffle.ContractInstance;
import TransactionDetails = Truffle.TransactionDetails;

export interface SubscriptionChangedEvent {
  vcid: number | BN;
  genRef: number | BN;
  expiresAt: number | BN;
  tier: string;
}

export interface PaymentEvent {
  vcid: number | BN;
  by: string;
  amount: number | BN;
  tier: string;
  rate: number | BN;
}

export interface VcConfigRecordChangedEvent {
  vcid: number | BN;
  key: string,
  value: string
}

export interface SubscriptionsContract extends ContractInstance, Contract {
  addSubscriber(address,params?: TransactionDetails): Promise<TransactionResponse>;
  setVcConfigRecord(vcid: number|BN, key: string, value: string, params?: TransactionDetails): Promise<TransactionResponse>;
  setContractRegistry(contractRegistry: string, params?: TransactionDetails): Promise<TransactionResponse>;
}
