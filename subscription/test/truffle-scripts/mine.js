/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const blocks = process.env.BLOCKS_TO_MINE;

const util = require('util');
const HDWalletProvider = require("truffle-hdwallet-provider");
const Web3 = require("web3");

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function mine(sendRpc) {
    await sleep(1010); // must not close two blocks with the same ts
    return sendRpc({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getSeconds()
    });
}

(async function () {
    try {
        const mnemonic = "vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid";
        const provider = new HDWalletProvider(mnemonic, "http://localhost:7545", 0, 10);
        const web3 = new Web3(provider);
        const sendRpc = util.promisify(provider.send.bind(provider));

        let beforeBlock = await web3.eth.getBlock("latest");
        let n = 0;
        while (n < blocks) {
            await mine(sendRpc);
            n++;
        }
        let afterBlock = await web3.eth.getBlock("latest");
        console.log(`stared at block ${beforeBlock.number}, now ${afterBlock.number} (mined ${afterBlock.number - beforeBlock.number})`);

        provider.engine.stop(); // otherwise the code doesn't terminate;

    } catch (e) {
        console.log("caught error", e);
    }


})();
