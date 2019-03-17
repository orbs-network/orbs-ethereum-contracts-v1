
const OrbsValidators = artifacts.require('OrbsValidators');
const OrbsValidatorsRegistry = artifacts.require('OrbsValidatorsRegistry');
const OrbsVoting = artifacts.require('OrbsVoting');
const OrbsGuardians = artifacts.require('OrbsGuardians');

module.exports.numToAddress = (num) => {
    return web3.utils.toChecksumAddress(web3.utils.padLeft(web3.utils.toHex(num), 40));
};

module.exports.Driver = class {
    constructor(){
        this.runningCounter = 0;
        this.registrationDeposit = web3.utils.toWei("0.01", "ether");
    }

    async deployVoting(maxVoteOutNodes) {
        if (isNaN(maxVoteOutNodes)) {
            maxVoteOutNodes = 3;
        }
        this.OrbsVoting = await OrbsVoting.new(maxVoteOutNodes);
    }
    async deployRegistry() {
        this.OrbsRegistry = await OrbsValidatorsRegistry.new();
    };

    async deployValidators(maxValidators) {
        if (this.OrbsRegistry === undefined) {
            await this.deployRegistry();
        }
        this.OrbsValidators = await OrbsValidators.new(this.OrbsRegistry.address, maxValidators);
    };

    async deployGuardians() {
        this.OrbsGuardians = await OrbsGuardians.new(this.registrationDeposit);
    };

    async deployValidatorsWithRegistry(maxValidators) {
        await this.deployRegistry();
        await this.deployValidators(maxValidators)
    };

    async addValidatorWithData(validatorAddress) {
        await this.OrbsValidators.addValidator(validatorAddress);
        await this.register(validatorAddress);
    };

    async register(validatorAddress) {
        this.runningCounter++;
        const name = "somename" + this.runningCounter;
        const url = "http://somedomain.com/?" + this.runningCounter;
        const orbsAddr = exports.numToAddress(8765 + this.runningCounter);
        const ip = ("0x" + this.runningCounter +"00000000").slice(0, 10);

        await this.OrbsRegistry.register(name, ip, url, orbsAddr, {from: validatorAddress});
    };
};