import {Contract} from "../eth";
import {TransactionConfig, TransactionReceipt} from "web3-core";

export interface ContractRegistryContract extends Contract {
  set(contractName: string, addr: string, params?: TransactionConfig): Promise<TransactionReceipt>;
  get(contractName: string, params?: TransactionConfig): Promise<string>;
}

export interface ContractAddressUpdatedEvent {
  contractName: string,
  addr: string
}

