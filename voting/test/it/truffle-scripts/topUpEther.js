const helpers = require('./helpers');
const MIN_BALANCE_FEES = web3.utils.toWei("0.4", "ether");

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
            return helpers.verifyEtherBalance(web3, address, MIN_BALANCE_FEES, accounts[0]);
        });

        await Promise.all(txs);

        done();

    } catch (e) {
        console.log(e);
        done(e);
    }
};
