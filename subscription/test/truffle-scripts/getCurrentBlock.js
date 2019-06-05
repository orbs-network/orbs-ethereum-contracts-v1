/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
const HDWalletProvider = require("truffle-hdwallet-provider");
const Web3 = require("web3");

(async function () {
    try {
        const mnemonic = "vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid";
        const ganacheHost = process.env.GANACHE_HOST || "localhost";
        const provider = new HDWalletProvider(mnemonic, `http://${ganacheHost}:7545`, 0, 10);
        const web3 = new Web3(provider);

        const block = await web3.eth.getBlock("latest")

        console.log(JSON.stringify({
            CurrentBlock: block.number
        }, null, 2));
        
        provider.engine.stop(); // otherwise the code doesn't terminate;

    } catch (e) {
        console.log("caught error", e);
    }


})();
