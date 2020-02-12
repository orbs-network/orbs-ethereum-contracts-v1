import { Contract as web3Contract } from "web3-eth-contract";
export interface Contract extends web3Contract {
  address: string;
}
