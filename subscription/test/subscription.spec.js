const {expect} = require("chai");
const Orbs = require("orbs-client-sdk");
const {EthereumAdapter} = require("./ethereumAdapter");

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

describe("orbs network", async () => {
    let ethereum;
    before(async ()=>{
        ethereum = await EthereumAdapter.build();
    });

    after(()=>{
        ethereum.stop();
    });

    it("rejects transactions after refreshing when subscription in not valid", async () => {

        const orbsEndpoint = "http://localhost:8080";
        const orbsVchain = 42;
        const signer = Orbs.createAccount();

        const client = new Orbs.Client(orbsEndpoint, orbsVchain, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);
        const [t1] = client.createTransaction(signer.publicKey, signer.privateKey, "_Info", "isAlive", []);
        const result1 = await client.sendTransaction(t1);

        expect(result1.executionResult).to.equal("SUCCESS");

        const subscriptionManager = await ethereum.deploySubscriptionManager();
        expect(subscriptionManager.address).to.be.ok;

        // finality
        const currentBlock = await ethereum.getLatestBlock();
        await ethereum.waitForBlock(currentBlock.number + 10);
        await sleep(2000);

        const [refreshSubTx] = client.createTransaction(signer.publicKey, signer.privateKey, "_GlobalPreOrder", "refreshSubscription", [Orbs.argString(subscriptionManager.address)]);

        const refreshSubTxResult = await client.sendTransaction(refreshSubTx);
        expect(refreshSubTxResult.executionResult).to.equal("SUCCESS");

        const [t2] = client.createTransaction(signer.publicKey, signer.privateKey, "_Info", "isAlive", []);
        const result2 = await client.sendTransaction(t2);

        expect(result2.executionResult).to.equal("NOT_EXECUTED");
    })
});


