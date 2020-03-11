import BN from "bn.js";
export declare const retry: (n: number, f: () => Promise<void>) => () => Promise<void>;
export declare const evmIncreaseTime: (seconds: number) => Promise<unknown>;
export declare function bn(x: string | BN | number | Array<string | BN | number>): any;
//# sourceMappingURL=helpers.d.ts.map