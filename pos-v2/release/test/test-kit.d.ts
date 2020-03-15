/// <reference types="node" />
import { ChildProcess } from 'child_process';
import { Driver } from './driver';
export { Driver } from './driver';
export declare function createVC(d: Driver): Promise<import("web3-core").TransactionReceipt>;
export declare const ganache: {
    process: ChildProcess | null;
    startGanache(): Promise<void>;
    stopGanache(): void;
};
//# sourceMappingURL=test-kit.d.ts.map