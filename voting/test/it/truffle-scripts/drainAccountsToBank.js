const helpers = require("./helpers");

module.exports = async function (done) {
    try {

        let accounts = await web3.eth.getAccounts();

        let txs = accounts.map(address => {

            if (accounts[0] === address) {
                return Promise.resolve();
            }
            return web3.eth.getBalance(address).then((balance)=>{
                let amount = web3.utils.toBN(balance).sub((web3.utils.toBN(web3.utils.toWei('24', "gwei"))).mul(web3.utils.toBN(21000))).toString();
                if (amount < 0) {
                    return Promise.resolve();
                }
                console.error(`transferring ${amount} bank`);

                return web3.eth.sendTransaction({to:accounts[0], from:address, value:amount, gasPrice: helpers.GAS_PRICE}).on("transactionHash", hash => {
                    console.error("TxHash (drain accounts): " + hash);
                });
            });
        });

        await Promise.all(txs);

        done();

    } catch (e) {
        console.log(e);
        done(e);
    }
};
