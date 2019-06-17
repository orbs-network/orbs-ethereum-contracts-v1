const Orbs = require("orbs-client-sdk");

class OrbsAdapter {
    constructor(url, vChainId, finalityCompBlocks, finalityCompSeconds) {
        this.url = url;
        this.vChainId = vChainId;
        this.finalityCompBlocks = finalityCompBlocks;
        this.finalityCompSeconds = finalityCompSeconds;

        this.accounts = [Orbs.createAccount()];
        this.client = new Orbs.Client(url, vChainId, Orbs.NetworkType.NETWORK_TYPE_TEST_NET)
    }

    contract(name) {
        return new OrbsContract(name, this.client);
    }

    static async build() {

        // TODO - select network to run against.

        const gammaUrl = process.env.GAMMA_URL || "http://localhost:8080";
        return new OrbsAdapter(gammaUrl, 42, 10, 2);
    }
}

class OrbsContract {
    constructor(name, client) {
        this.name = name;
        this.client = client;
    }

    transact(signer, methodName, ...args) {
        const [t] = this.client.createTransaction(signer.publicKey, signer.privateKey, this.name, methodName, args);
        return this.client.sendTransaction(t);
    }

    query(signer, methodName, ...args) {
        const q = this.client.createQuery(signer.publicKey, this.name, methodName, args);
        return this.client.sendQuery(q);
    }

}

module.exports = {OrbsAdapter};
