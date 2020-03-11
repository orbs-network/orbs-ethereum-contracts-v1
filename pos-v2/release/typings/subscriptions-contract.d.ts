import {Contract} from "../eth";

import {TransactionConfig, TransactionReceipt} from "web3-core";
import * as BN from "bn.js";

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

export interface VcOwnerChangedEvent {
    vcid: number | BN;
    previousOwner: string;
    newOwner: string;
}

export interface VcCreatedEvent {
    vcid: number | BN;
    owner: string;
}

export interface SubscriptionsContract extends Contract {
  addSubscriber(address,params?: TransactionConfig): Promise<TransactionReceipt>;
  setVcConfigRecord(vcid: number|BN, key: string, value: string, params?: TransactionConfig): Promise<TransactionReceipt>;
  getVcConfigRecord(vcid: number|BN, key: string, params?: TransactionConfig): Promise<TransactionReceipt>;
  setContractRegistry(contractRegistry: string, params?: TransactionConfig): Promise<TransactionReceipt>;
  setVcOwner(vcid: number|BN, owner: string, params?: TransactionConfig): Promise<TransactionReceipt>;
}
