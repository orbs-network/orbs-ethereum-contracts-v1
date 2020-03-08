import Web3 from "web3";
import {compiledContracts} from "./compiled-contracts";
import { Contract as Web3Contract } from "web3-eth-contract";
import BN from "bn.js";
const HDWalletProvider = require("truffle-hdwallet-provider");

export const ETHEREUM_URL = process.env.ETHEREUM_URL || "http://localhost:7545";
const ETHEREUM_MNEMONIC = process.env.ETHEREUM_MNEMONIC || "vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid";


const refreshWeb3 = () => {
    web3 = new Web3(new HDWalletProvider(
        ETHEREUM_MNEMONIC,
        ETHEREUM_URL,
        0,
        100,
        false
        )
    );
};

export var web3;
refreshWeb3();

export class Contract {

    constructor(private abi, public web3Contract: Web3Contract) {
        Object.keys(web3Contract.methods)
            .filter(x => x[0] != '0')
            .forEach(m => {
                this[m] = function () {
                    return this.callContractMethod(m, abi.find(x => x.name == m), Array.from(arguments));
                };
                this[m].bind(this);
            })
    }

    get address(): string {
        return this.web3Contract.options.address;
    }

    private recreateWeb3Contract() {
        refreshWeb3();
        this.web3Contract = new web3.eth.Contract(this.abi, this.address);
    }

    private async callContractMethod(method: string, methodAbi, args: any[]) {
        const accounts = await web3.eth.getAccounts();
        let opts = {};
        if (args.length > 0 && JSON.stringify(args[args.length - 1])[0] == '{') {
            opts = args.pop();
        }
        args = args.map(x => BN.isBN(x) ? x.toString() : Array.isArray(x) ? x.map(_x => BN.isBN(_x) ? _x.toString() : _x) : x);
        const action = methodAbi.stateMutability == "view" ? "call" : "send";
        try {
            const ret = await this.web3Contract.methods[method](...args)[action]({
                from: accounts[0],
                gas: 6700000,
                ...opts
            }); // if we return directly, it will not throw the exceptions but return a rejected promise
            return ret;
        } catch(e) {
            this.recreateWeb3Contract();
            throw e;
        }
    }

}

export async function deploy(contractName: string, args: any[], options?: any): Promise<any> {
    const accounts = await web3.eth.getAccounts();
    const abi = compiledContracts[contractName].abi;

    try {
        const web3Contract = await (new web3.eth.Contract(abi).deploy({
            data: compiledContracts[contractName].bytecode,
            arguments: args || []
        }).send({
            from: accounts[0],
            ...(options || {})
        }));
        return new Contract(abi, web3Contract);
    } catch (e) {
        refreshWeb3();
        throw e;
    }
}

