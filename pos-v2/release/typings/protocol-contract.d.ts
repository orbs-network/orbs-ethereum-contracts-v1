import {TransactionConfig, TransactionReceipt} from "web3-core";
import {Contract} from "../eth";

export interface ProtocolChangedEvent {
  deploymentSubset: string,
  protocolVersion: number,
  asOfBlock: number
}

export interface ProtocolContract extends Contract {
  setProtocolVersion(deploymentSubset: string, protocolVersion: number, asOfBlock: number,params?: TransactionConfig): Promise<TransactionReceipt>;
  deploymentSubsetExists(deploymentSubset: string, params?: TransactionConfig): Promise<boolean>;
}
