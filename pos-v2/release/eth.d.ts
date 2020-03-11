import { Contract as Web3Contract } from "web3-eth-contract";
export declare const ETHEREUM_URL: string;
export declare var web3: any;
export declare class Contract {
    private abi;
    web3Contract: Web3Contract;
    constructor(abi: any, web3Contract: Web3Contract);
    get address(): string;
    private recreateWeb3Contract;
    private callContractMethod;
}
export declare function deploy(contractName: string, args: any[], options?: any): Promise<any>;
//# sourceMappingURL=eth.d.ts.map