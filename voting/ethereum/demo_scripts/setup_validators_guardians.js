var Guardians = artifacts.require("./OrbsGuardians.sol");
var Validators = artifacts.require("./OrbsValidators.sol");
var ValidatorsRegistry = artifacts.require("./OrbsValidatorsRegistry.sol");
var Voting = artifacts.require("./OrbsVoting.sol");

let uniqueValuesNonce = 0;

const GUARDIAN_REG_DEPOSIT = web3.utils.toWei('1', 'ether');

const MIN_BALANCE_FOR_FEES = web3.utils.toWei("0.5", "ether");
const MIN_BALANCE_FOR_DEPOSIT = web3.utils.toWei("1.5", "ether");

module.exports = async function(done) {
    try {

        const guardiansContract = await Guardians.deployed();
        const validatorsContract = await Validators.deployed();
        const validatorsRegistryContract = await ValidatorsRegistry.deployed();

        const accounts = await web3.eth.getAccounts();

        console.log(`Guardian:            ${guardiansContract.address}`);
        console.log(`Validators:          ${validatorsContract.address}`);
        console.log(`Validators Registry: ${validatorsRegistryContract.address}`);
        console.log(`Voting:              ${(await Voting.deployed()).address}`);
        console.log("\n");

        await registerValidator(validatorsContract, validatorsRegistryContract, accounts[1], accounts[0]);
        await registerValidator(validatorsContract, validatorsRegistryContract, accounts[2], accounts[0]);
        await registerValidator(validatorsContract, validatorsRegistryContract, accounts[3], accounts[0]);
        await registerValidator(validatorsContract, validatorsRegistryContract, accounts[4], accounts[0]);
        await registerValidator(validatorsContract, validatorsRegistryContract, accounts[5], accounts[0]);

        await registerGuardian(guardiansContract, accounts[6], accounts[0]);
        await registerGuardian(guardiansContract, accounts[7], accounts[0]);
        await registerGuardian(guardiansContract, accounts[8], accounts[0]);
        await registerGuardian(guardiansContract, accounts[9], accounts[0]);

    } catch (e) {
        console.log(e);
    }
    done();
};

async function registerValidator(v, vr, account, bank) {
    uniqueValuesNonce++;
    const name = "Validator " + uniqueValuesNonce;
    const url = "http://validators.com/" + uniqueValuesNonce;
    const orbsAddr = numToAddress(8765 + uniqueValuesNonce);
    const ip = ("0x" + uniqueValuesNonce +"00000000").slice(0, 10);

    let message = "adding validator " + account + ": ";
    if (!await vr.isValidator(account)) {
        await verifyBalance(account, MIN_BALANCE_FOR_FEES, bank);
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

async function registerGuardian(g, account, bank) {
    uniqueValuesNonce++;
    const name = "Guardian " + uniqueValuesNonce;
    const url = "http://guardians.com/" + uniqueValuesNonce;

    let message = "registering guardian " + account + ": ";
    if (!await g.isGuardian(account)) {
        await verifyBalance(account, MIN_BALANCE_FOR_DEPOSIT, bank);
        await g.register(name, url, {from: account, value: GUARDIAN_REG_DEPOSIT}); // register one guardian
        message = message + "regisreted, "
    }
    message = message + "done.";
    console.log(message);
}

function numToAddress(num) {
    return web3.utils.toChecksumAddress(web3.utils.padLeft(web3.utils.toHex(num), 40));
}


async function verifyBalance(targetAccount, minBalance, bankAccount) {
    const initial = await web3.eth.getBalance(targetAccount);
    if (web3.utils.toBN(initial).gte(web3.utils.toBN(minBalance))) {
        console.log(`verified balance for ${targetAccount} is at least ${minBalance} (${initial})`);
        return;
    }

    const diff = web3.utils.toBN(minBalance).sub(web3.utils.toBN(initial)).toString();
    console.log(`insufficient balance for ${targetAccount} transferring: ${diff}...`);
    await web3.eth.sendTransaction({to:targetAccount, from:bankAccount, value:diff});
    console.log(`new balance: ${await web3.eth.getBalance(targetAccount)}`);

}