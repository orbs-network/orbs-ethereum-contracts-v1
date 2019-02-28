module.exports.assertReject = async (promise, message) => {
    const error = await promise.then(()=>{
        assert.fail(message);
    },(e) => e);
    return error;
};

module.exports.assertResolve = async (promise, message) => {
    const result = await promise.then(r => r, () => {
        assert.fail(message);
    });
    return result;
};