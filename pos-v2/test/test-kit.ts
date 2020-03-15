import { spawn, ChildProcess } from 'child_process';
import { ETHEREUM_URL } from '../eth';
import fetch from 'node-fetch';
import { retry } from 'ts-retry-promise';
import BN from 'bn.js';
import { Driver, DEPLOYMENT_SUBSET_MAIN } from './driver';

export { Driver } from './driver';

export async function createVC(d : Driver) {
    const monthlyRate = new BN(1000);
    const firstPayment = monthlyRate.mul(new BN(2));

    const subscriber = await d.newSubscriber('defaultTier', monthlyRate);
    // buy subscription for a new VC
    const appOwner = d.newParticipant();
    await d.erc20.assign(appOwner.address, firstPayment); // TODO extract assign+approve to driver in two places
    await d.erc20.approve(subscriber.address, firstPayment, {
        from: appOwner.address
    });

    return subscriber.createVC(firstPayment, DEPLOYMENT_SUBSET_MAIN, {
        from: appOwner.address
    });
}
export const ganache = {
    process: null as ChildProcess | null,
    async startGanache() {
        if (ganache.process) {
            throw new Error(`ganache-cli process already running! PID=${ganache.process.pid}`);
        }
        const process = spawn(
            'ganache-cli',
            [
                '-p',
                '7545',
                '-i',
                '5777',
                '-a',
                '100',
                '-m',
                'vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid'
            ],
            { stdio: 'pipe' }
        );
        ganache.process = process;
        await retry(
            () =>
                fetch(ETHEREUM_URL, {
                    method: 'POST',
                    body: JSON.stringify({ jsonrpc: '2.0', method: 'web3_clientVersion', params: [], id: 67 })
                }),
            { retries: 10, delay: 300 }
        );
        console.log('Ganache is up');
    },
    stopGanache() {
        if (ganache.process) {
            console.log('Ganache goes down');
            ganache.process.kill('SIGINT');
        }
    }
};