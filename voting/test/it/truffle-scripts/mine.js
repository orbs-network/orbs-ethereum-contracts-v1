const blocks = process.env.BLOCKS_TO_MINE;

const util = require('util');
const sendRpc = util.promisify(web3.currentProvider.send);

async function mine() {
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

    } catch (e) {
        console.log(e);
        done(e);
    }
};
