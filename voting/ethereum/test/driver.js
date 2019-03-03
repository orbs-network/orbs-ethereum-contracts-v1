
const assertResolve = require('./assertExtensions').assertResolve;

module.exports.numToAddress = (num) => {
    return web3.utils.toChecksumAddress(web3.utils.padLeft(web3.utils.toHex(num), 40));
};

let runningCounter = 0;

module.exports.addValidatorWithData = async (contract, validatorAddress) => {
    runningCounter++;
    const name = "somename" + runningCounter;
    const url = "http://somedomain.com/?" + runningCounter;
    const orbsAddr = exports.numToAddress(8765 + runningCounter);
    const ip = ("0x" + runningCounter +"00000000").slice(0, 10);

    await assertResolve(contract.addValidator(validatorAddress));
    await assertResolve(contract.setValidatorData(name, ip, url, orbsAddr, {from: validatorAddress}));
};