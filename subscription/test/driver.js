
const {EthereumAdapter, OrbsAdapter} = require("psilo");

const Orbs = require("orbs-client-sdk");

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

class Driver {
    constructor(ethereum, orbs) {
        this.ethereum = ethereum;
        this.orbs = orbs;
    }

    async sendGenericOrbsTransaction() {
        const signer = this.orbs.accounts[0];
        const client = this.orbs.client;

        const [t] = client.createTransaction(signer.publicKey, signer.privateKey, "_Info", "isAlive", []);
        return await client.sendTransaction(t);
    }

    async deploySubscriptionManager() {
        const signer = this.ethereum.accounts[0];
        return await this.ethereum.deploySolidityContract({from: signer}, 'FakeSubscriptionChecker');
    }

    async waitForOrbsFinality(targetBlockNumber) {
        const currentBlock = await this.ethereum.getLatestBlock();
        if (targetBlockNumber === undefined) {
            targetBlockNumber = currentBlock.number; // default to current top
        }
        await this.ethereum.waitForBlock(targetBlockNumber + this.orbs.finalityCompBlocks);
        await this.orbs.increaseTime(this.orbs.finalityCompBlocks);

        await sleep(this.orbs.finalityCompSeconds * 1000);
    }

    async setSubscriptionManager(subscriptionManagerAddress) {
        const client = this.orbs.client;
        const signer = this.orbs.accounts[0];
        const [refreshSubTx] = client.createTransaction(signer.publicKey, signer.privateKey, "_GlobalPreOrder", "refreshSubscription", [Orbs.argString(subscriptionManagerAddress)]);
        return await client.sendTransaction(refreshSubTx);
    }

    stop() {
        this.ethereum.stop();
    }

    static async build() {
        return new Driver(
            await EthereumAdapter.build(),
            await OrbsAdapter.build()
        )
    }
}

module.exports = {Driver};
