import { Contract } from "./contract";
import TransactionDetails = Truffle.TransactionDetails;
import TransactionResponse = Truffle.TransactionResponse;

export interface ContractRegistryContract extends Contract {
  set(contractName: string, addr: string, params?: TransactionDetails): Promise<TransactionResponse>;
  get(contractName: string, params?: TransactionDetails): Promise<string>;
}

export interface ContractAddressUpdatedEvent {
  contractName: string,
  addr: string
}

