var Guardians = artifacts.require("./OrbsGuardians.sol");
var Validators = artifacts.require("./OrbsValidators.sol");
var ValidatorsRegistry = artifacts.require("./OrbsValidatorsRegistry.sol");

let uniqueValuesNonce = 0;

module.exports = async function(done) {
    try {

        const guardiansContract = await Guardians.deployed();
        const validatorsContract = await Validators.deployed();
        const validatorsRegistryContract = await ValidatorsRegistry.deployed();

        const accounts = await web3.eth.getAccounts();

        console.log(`Guardian:            ${guardiansContract.address}`);
        console.log(`Validators:          ${validatorsContract.address}`);
        console.log(`Validators Registry: ${validatorsRegistryContract.address}`);
        console.log("\n");

        await registerValidator(validatorsContract, validatorsRegistryContract, accounts[1]);
        await registerValidator(validatorsContract, validatorsRegistryContract, accounts[2]);
        await registerValidator(validatorsContract, validatorsRegistryContract, accounts[3]);
        await registerValidator(validatorsContract, validatorsRegistryContract, accounts[4]);
        await registerValidator(validatorsContract, validatorsRegistryContract, accounts[5]);

        await registerGuardian(guardiansContract, accounts[6]);
        await registerGuardian(guardiansContract, accounts[7]);
        await registerGuardian(guardiansContract, accounts[8]);
        await registerGuardian(guardiansContract, accounts[9]);

    } catch (e) {
        console.log(e);
    }
    done();
};

async function registerValidator(v, vr, account) {
    uniqueValuesNonce++;
    const name = "Validator " + uniqueValuesNonce;
    const url = "http://validators.com/" + uniqueValuesNonce;
    const orbsAddr = numToAddress(8765 + uniqueValuesNonce);
    const ip = ("0x" + uniqueValuesNonce +"00000000").slice(0, 10);

    let message = "adding validator " + account + ": ";
    if (!await vr.isValidator(account)) {
        await vr.register(name, ip, url, orbsAddr, {from: account});
        message = message + "registered, ";
    }

    if (!await v.isValidator(account)) {
        await v.addValidator(account);
        message = message + "added to permitted validators, "
    }
    message = message + "done.";
    console.log(message);
}

async function registerGuardian(g, account) {
    uniqueValuesNonce++;
    const name = "Guardian " + uniqueValuesNonce;
    const url = "http://guardians.com/" + uniqueValuesNonce;

    let message = "registering guardian " + account + ": ";
    if (!await g.isGuardian(account)) {
        await g.register(name, url, {from: account}); // register one guardian
        message = message + "regisreted, "
    }
    message = message + "done.";
    console.log(message);
}

function numToAddress(num) {
    return web3.utils.toChecksumAddress(web3.utils.padLeft(web3.utils.toHex(num), 40));
}