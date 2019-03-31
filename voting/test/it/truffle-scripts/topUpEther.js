/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const helpers = require('./helpers');

const accountOnEthereumIndexes = process.env.ACCOUNT_INDEXES_ON_ETHEREUM;

module.exports = async function (done) {
    try {

        if (!accountOnEthereumIndexes) {
            throw("missing env variable ACCOUNT_INDEXES_ON_ETHEREUM");
        }

        let availableAccounts = await web3.eth.getAccounts();
        let accountIndexes = JSON.parse(accountOnEthereumIndexes);
        let accounts = accountIndexes.map(elem => availableAccounts[elem]);

        let txs = accounts.map(address => {
            if (availableAccounts[0] === address) {
                return Promise.resolve();
            }
            return helpers.verifyEtherBalance(web3, address, helpers.MIN_BALANCE_FEES, availableAccounts[0]);
        });

        await Promise.all(txs);

        done();

    } catch (e) {
        console.log(e);
        done(e);
    }
};
