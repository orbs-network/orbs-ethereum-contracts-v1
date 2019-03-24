/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const blocks = process.env.BLOCKS_TO_MINE;

const util = require('util');
const sendRpc = util.promisify(web3.currentProvider.send);

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function mine() {
    await sleep(1010); // must not close two blocks with the same ts
    return sendRpc({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getSeconds()
    });
}

module.exports = async function(done) {
    try {
        let beforeBlock = await web3.eth.getBlock("latest");
        let n = 0;
        while (n < blocks) {
            await mine();
            n++;
        }
        let afterBlock = await web3.eth.getBlock("latest");
        console.log(`stared at block ${beforeBlock.number}, now ${afterBlock.number} (mined ${afterBlock.number-beforeBlock.number})`);

        done();

    } catch (e) {
        console.log(e);
        done(e);
    }
};
