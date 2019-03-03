
const OrbsValidators = artifacts.require('OrbsValidators');
const OrbsValidatorsRegistry = artifacts.require('OrbsValidatorsRegistry');


const {assertResolve, assertReject} = require('./assertExtensions');

module.exports.numToAddress = (num) => {
    return web3.utils.toChecksumAddress(web3.utils.padLeft(web3.utils.toHex(num), 40));
};

module.exports.Driver = class {
    constructor(){
        this.runningCounter = 0;
    }

    async deployContracts(maxValidators) {
        this.OrbsRegistry = await OrbsValidatorsRegistry.new();
        this.OrbsValidators = await OrbsValidators.new(this.OrbsRegistry.address, maxValidators);
    };

    async addValidatorWithData(validatorAddress) {
        this.runningCounter++;
        const name = "somename" + this.runningCounter;
        const url = "http://somedomain.com/?" + this.runningCounter;
        const orbsAddr = exports.numToAddress(8765 + this.runningCounter);
        const ip = ("0x" + this.runningCounter +"00000000").slice(0, 10);

        await assertResolve(this.OrbsValidators.addValidator(validatorAddress));
        await assertResolve(this.OrbsValidators.register(name, ip, url, orbsAddr, {from: validatorAddress}));
    };
};