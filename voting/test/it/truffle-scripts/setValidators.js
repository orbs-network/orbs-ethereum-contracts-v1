const helpers = require('./helpers');

const validatorsContractAddress = process.env.VALIDATORS_CONTRACT_ADDRESS;
const validatorsRegistryContractAddress = process.env.VALIDATORS_REGISTRY_CONTRACT_ADDRESS;
const validatorAccountOnEthereumIndexes = process.env.VALIDATOR_ACCOUNT_INDEXES_ON_ETHEREUM;
const validatorOrbsAddresses = process.env.VALIDATOR_ORBS_ADDRESSES;
const validatorOrbsIps = process.env.VALIDATOR_ORBS_IPS;


module.exports = async function (done) {
    try {

        if (!validatorsContractAddress) {
            throw("missing env variable VALIDATORS_CONTRACT_ADDRESS");
        }

        if (!validatorsRegistryContractAddress) {
            throw("missing env variable VALIDATORS_REGISTRY_CONTRACT_ADDRESS");
        }

        if (!validatorAccountOnEthereumIndexes) {
            throw("missing env variable VALIDATOR_ACCOUNT_INDEXES_ON_ETHEREUM");
        }

        if (!validatorOrbsAddresses) {
            throw("missing env variable VALIDATOR_ORBS_ADDRESSES");
        }

        if (!validatorOrbsIps) {
            throw("missing env variable VALIDATOR_ORBS_IPS");
        }

        const validatorsInstance = await artifacts.require('IOrbsValidators').at(validatorsContractAddress);

        let accounts = await web3.eth.getAccounts();
        let validatorIndexes = JSON.parse(validatorAccountOnEthereumIndexes);
        let validators = validatorIndexes.map(elem => accounts[elem]);
        let ips = JSON.parse(validatorOrbsIps);
        let orbsAddresses = JSON.parse(validatorOrbsAddresses);

        let txs = validators.map(address => {
            return helpers.verifyEtherBalance(web3, address, helpers.MIN_BALANCE_FEES, accounts[0]).then(() => {
                return validatorsInstance.addValidator(address).on("transactionHash", hash => {
                    console.error("TxHash (OrbsValidators registration): " + hash);
                });
            });
        });


        await Promise.all(txs);

        const validatorsRegInstance = await artifacts.require('IOrbsValidatorsRegistry').at(validatorsRegistryContractAddress);

        txs = validators.map((address, i) => {
            return helpers.verifyEtherBalance(web3, address, helpers.MIN_BALANCE_FEES, accounts[0]).then(() => {
                return validatorsRegInstance.register(`Validator ${i}`, ips[i], `https://www.validator${i}.com`, orbsAddresses[i], web3.utils.randomHex(32), {from: address})
                    .on("transactionHash", hash => {
                        console.error("TxHash (OrbsValidatorsRegistry registration): " + hash);
                    });
            });
        });

        await Promise.all(txs);

        let indexToAddressMap = validatorIndexes.map(i => {
            return {Index: i, Address: accounts[i]};
        });
        console.log(JSON.stringify(indexToAddressMap, null, 2));

        done();

    } catch (e) {
        console.log(e);
        done(e);
    }
}
;
