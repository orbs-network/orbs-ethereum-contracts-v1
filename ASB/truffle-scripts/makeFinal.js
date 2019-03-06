const util = require('util');
const sendRpc = util.promisify(web3.currentProvider.send);

async function moveTimeBy(seconds) {
    return sendRpc({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [seconds],
        id: new Date().getSeconds()
    });
}

async function mine() {
    return sendRpc({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getSeconds()
    });
}

module.exports = async function(done) {
    console.log("Moving Ganache clock to current time by mining a block every 10 seconds")
    try {
        const now = new Date().getTime() / 1000;
        let latestBlockTime = 0;
        while (latestBlockTime < now) {
            await moveTimeBy(10);
            await mine();

            let latestBlock = await web3.eth.getBlock("latest");
            latestBlockTime = latestBlock.timestamp;
            console.log("Mined a block at time", new Date(latestBlockTime * 1000));
        }

    } catch (e) {
        console.log(e);
        done(e);
    }
};
