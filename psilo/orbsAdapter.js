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

    static async build() {

        // TODO - select network to run against.

        const gammaUrl = process.env.GAMMA_URL || "http://localhost:8080";
        return new OrbsAdapter(gammaUrl, 42, 10, 2);
    }
}

module.exports = {OrbsAdapter};