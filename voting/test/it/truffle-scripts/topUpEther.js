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
