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

const MIN_TIME_FOR_FINALITY_IN_SECONDS = 20 * 60;

// async function calculateBlockTime(latestBlock) {
//     const blockTimesInSeconds = [];
//     while (latestBlock.number > 1) {
//         const prevBlock = await web3.eth.getBlock(latestBlock.number - 1);
//         if (prevBlock) {
//             blockTimesInSeconds.push(latestBlock.timestamp - prevBlock.timestamp);
//             latestBlock = prevBlock;
//         }
//     }
//
//     if (blockTimesInSeconds.length > 1) {
//         return Math.round(blockTimesInSeconds.reduce((a, b) => b + a) / blockTimesInSeconds.length);
//     } else {
//         return 10;
//     }
// }

module.exports = async function(done) {

    try {
        const now = new Date().getTime() / 1000;

        console.log("System time is", new Date());

        let latestBlock = await web3.eth.getBlock("latest");

        if (now - latestBlock.timestamp < MIN_TIME_FOR_FINALITY_IN_SECONDS) {
            console.log("Latest block time is", new Date(latestBlock.timestamp * 1000), "which is too young for finality. Please start Ganache at -2 minutes at least");
            process.exit(1)
        }

        let blockTimeInSeconds = 10;
        console.log("Moving Ganache clock to current time by mining a block every", blockTimeInSeconds, "seconds")

        let latestBlockTime = 0;
        while (latestBlockTime <= now) {
            await moveTimeBy(blockTimeInSeconds);
            await mine();

            let latestBlock = await web3.eth.getBlock("latest");
            latestBlockTime = latestBlock.timestamp;
            console.log("Mined block", latestBlock.number, "at time", new Date(latestBlockTime * 1000));
        }

    } catch (e) {
        console.log(e);
        done(e);
    }
};
