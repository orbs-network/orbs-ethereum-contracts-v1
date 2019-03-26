/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */


module.exports = async function (done) {
    try {

        let accounts = await web3.eth.getAccounts();

        const gasPrice = await web3.eth.getGasPrice();


        let txs = accounts.map((address) => {
            return web3.eth.getBalance(address);
        });

        const balances = (await Promise.all(txs)).map(n => web3.utils.toBN(n));
        const total = balances.reduce((partial_sum, a) => partial_sum.add(a), web3.utils.toBN(0));

        console.error();
        console.error(`--------------------------------------------------------------`);
        console.error(`Total balance for ${accounts.length} accounts: ${total}`);
        console.error(`Current avg gas price: ${gasPrice}`);
        console.error(`--------------------------------------------------------------`);
        console.error();
        
        done();

    } catch
        (e) {
        console.log(e);
        done(e);
    }
}
;
