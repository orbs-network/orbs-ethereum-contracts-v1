/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
const {EthereumAdapter} = require("./../ethereumAdapter");

(async function () {
    let ethereum;
    try {
        ethereum = await EthereumAdapter.build();
        const signer = ethereum.accounts[0];
        const contractName = 'FakeSubscriptionChecker';

        const instance = await ethereum.deploySolidityContract({from: signer}, contractName);
        console.log(JSON.stringify({
            Address: instance.address
        }, null, 2));

    } catch (e) {
        console.log("caught error", e);
    }
    ethereum.stop(); // otherwise the code doesn't terminate;
})();

