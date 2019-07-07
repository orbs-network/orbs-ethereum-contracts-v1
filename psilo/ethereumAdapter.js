const HDWalletProvider = require("truffle-hdwallet-provider");
const Web3 = require("web3");
const Resolver = require("truffle-resolver");
const path = require("path");

const util = require('util');

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

class EthereumAdapter {
    constructor(web3, resolver, accounts, networkId) {
        this.web3 = web3;
        this.resolver = resolver;
        this.accounts = accounts;
        this.networkId = networkId;
    }

    async deploySolidityContract(options, import_path, search_path, ...constructorArguments) {

        const contract = this.resolver.require(import_path, search_path);

        const ctorParams = [...constructorArguments, options];
        return await contract.new(...ctorParams);
    }

    //TODO this currently only handles Ganache - for ropsten or mainnet we need to add busywaits with sleeps
    async waitForBlock(blockNumber) {
        const currentBlock = await this.getLatestBlock();
        const blocksToMine = blockNumber - currentBlock.number;
        if (blocksToMine) {
            await this.mine(blocksToMine);
        }
    }

    async getLatestBlock() {
        return await this.web3.eth.getBlock("latest");
    }

    async mine(blocks) {
        try {
            const web3 = this.web3;
            const provider = web3.currentProvider;
            const sendRpc = util.promisify(provider.send.bind(provider));

            let beforeBlock = await this.getLatestBlock();
            let n = 0;
            while (n < blocks) {
                await mineOne(sendRpc);
                n++;
            }
            let afterBlock = await this.getLatestBlock();
            console.log(`stared at block ${beforeBlock.number}, now ${afterBlock.number} (mined ${afterBlock.number - beforeBlock.number})`);

        } catch (e) {
            console.log("caught error", e);
        }
    }

    stop() {
        return this.web3.currentProvider.engine.stop();
    }

    static async build(ethereumUrl, mnemonic) {

        // TODO - select network to run against.

        mnemonic = mnemonic || "vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid";
        ethereumUrl = ethereumUrl || process.env.GANACHE_URL || "http://localhost:7545";
        const provider = new HDWalletProvider(mnemonic, ethereumUrl, 0, 25);
        const web3 = new Web3(provider);

        const config = {
            working_directory: path.resolve("."),
            contracts_build_directory: path.resolve("..", "ethereum", "build", "contracts"),
            compilers: {
                solc: {
                    version: '0.4.25',       // Fetch exact version from solc-bin (default: truffle's version)
                    settings: {          // See the solidity docs for advice about optimization and evmVersion
                        optimizer: {
                            enabled: true,
                            runs: 200
                        }
                    }
                }
            },
            provider
        };

        const networkId = await web3.eth.net.getId();
        const accounts = await web3.eth.getAccounts();
        config.network_id = networkId;

        const resolver = new Resolver(config);

        return new EthereumAdapter(web3, resolver, accounts, networkId);
    }

}

async function mineOne(sendRpc) {
    await sleep(1010); // must not close two blocks with the same ts
    return sendRpc({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getSeconds()
    });
}

module.exports = {EthereumAdapter};
