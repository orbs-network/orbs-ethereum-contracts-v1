import { Contract as web3Contract } from "web3-eth-contract";
import ContractInstance = Truffle.ContractInstance;

export interface Contract extends web3Contract, ContractInstance {}
