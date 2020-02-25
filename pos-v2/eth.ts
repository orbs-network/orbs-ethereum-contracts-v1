import Web3 from "web3";
import {compiledContracts} from "./compiled-contracts";
import { Contract as Web3Contract } from "web3-eth-contract";
import BN from "bn.js";
const HDWalletProvider = require("truffle-hdwallet-provider");

export const ETHEREUM_URL = process.env.ETHEREUM_URL || "http://localhost:7545";
const ETHEREUM_MNEMONIC = process.env.ETHEREUM_MNEMONIC || "vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid";
export const web3 = new Web3(new HDWalletProvider(
    ETHEREUM_MNEMONIC,
    ETHEREUM_URL,
    0,
    100
    )
);

let syncP:any = Promise.resolve();
function sync(f) {
    const p = syncP.then(f);
    syncP = p.catch(() => {});
    return p;
}

function clearNonceCache() {
    const provider = web3.currentProvider;
    const np = (provider as any).engine._providers.find(p => p.nonceCache != null);
    if (np == null) {
        console.log("WARNING: provider hack doesn't work, consider remove clearNonceCache");
        return;
    }
    np.nonceCache = {};
}

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

    private async callContractMethod(method: string, methodAbi, args: any[]) {
        return sync(async () => {
            clearNonceCache();
            const accounts = await web3.eth.getAccounts();
            let opts = {};
            if (args.length > 0 && JSON.stringify(args[args.length - 1])[0] == '{') {
                opts = args.pop();
            }
            args = args.map(x => BN.isBN(x) ? x.toString() : Array.isArray(x) ? x.map(_x => BN.isBN(_x) ? _x.toString() : _x) : x);
            const action = methodAbi.stateMutability == "view" ? "call" : "send";
            return this.web3Contract.methods[method](...args)[action]({
                from: accounts[0],
                gas: 6700000,
                ...opts
            });
        });
    }

}

export async function deploy(contractName: string, args: any[], options?: any): Promise<any> {
    return sync(async () => {
        clearNonceCache();
        const accounts = await web3.eth.getAccounts();
        const abi = compiledContracts[contractName].abi;
        const web3contract = await (new web3.eth.Contract(abi).deploy({
            data: compiledContracts[contractName].bytecode,
            arguments: args || []
        }).send({
            from: accounts[0],
            ...(options || {})
        }));
        return new Contract(abi, web3contract);
    });
}

