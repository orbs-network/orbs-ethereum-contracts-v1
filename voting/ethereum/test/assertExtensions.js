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