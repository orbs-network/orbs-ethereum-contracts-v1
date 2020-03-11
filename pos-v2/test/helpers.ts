import Web3 from "web3";
import BN from "bn.js";
import {web3} from "../eth";

export const retry = (n: number, f: () => Promise<void>) => async  () => {
    for (let i = 0; i < n; i++) {
        await f();
    }
};

export const evmIncreaseTime = async (seconds: number) => new Promise(
    (resolve, reject) =>
        (web3.currentProvider as any).send(
            {method: "evm_increaseTime", params: [seconds]},
            (err, res) => err ? reject(err) : resolve(res)
        )
);

export function bn(x: string|BN|number|Array<string|BN|number>) {
    if (Array.isArray(x)) {
        return x.map(n => bn(n))
    }
    return new BN(x);
}
