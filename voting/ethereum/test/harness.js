

module.exports.numToAddress = function (num) {
    return web3.utils.toChecksumAddress(web3.utils.padLeft(web3.utils.toHex(num), 40));
};

module.exports.assertReject = async (promise, message) => {
    const REJECTED = "REJECTED";
    const result = await promise.catch(() => REJECTED);
    assert.equal(result, REJECTED, message);
};

module.exports.assertResolve = async (promise, message) => {
    const REJECTED = "REJECTED";
    const result = await promise.catch(() => REJECTED);
    assert.notEqual(result, REJECTED, message);
};