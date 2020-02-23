import { Contract } from "web3-eth-contract";

import TransactionResponse = Truffle.TransactionResponse;
import ContractInstance = Truffle.ContractInstance;
import TransactionDetails = Truffle.TransactionDetails;

export interface ProtocolChangedEvent {
  deploymentSubset: string,
  protocolVersion: number,
  asOfBlock: number
}

export interface ProtocolContract extends ContractInstance, Contract {
  setProtocolVersion(deploymentSubset: string, protocolVersion: number, asOfBlock: number,params?: TransactionDetails): Promise<TransactionResponse>;
  setGovernor(newGovernor: string, params?: TransactionDetails): Promise<TransactionResponse>;
  deploymentSubsetExists(deploymentSubset: string, params?: TransactionDetails): Promise<boolean>;
}
