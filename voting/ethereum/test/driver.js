
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
        this.registrationMinTime = 0;
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

    async deployGuardians(registrationMinTime) {
        if (isNaN(registrationMinTime)) {
            registrationMinTime = this.registrationMinTime;
        }
        this.OrbsGuardians = await OrbsGuardians.new(this.registrationDeposit,registrationMinTime);
    };

    async deployValidatorsWithRegistry(maxValidators) {
        await this.deployRegistry();
        await this.deployValidators(maxValidators)
    };

    async approveAndRegister(validatorAddress) {
        await this.OrbsValidators.approve(validatorAddress);
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

    depositOptions(address) {
        return {
            from: address,
            value: this.registrationDeposit
        }
    };

    noDepositOptions(address) {
        return {
            from: address,
            value: 0
        }
    };

};