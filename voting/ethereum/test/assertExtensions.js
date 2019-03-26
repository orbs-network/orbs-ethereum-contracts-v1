
module.exports.assertReject = async (promise, message) => {
    try{
        await promise;
    }catch (e) {
        return e;
    }
    assert.fail(message);
};

module.exports.assertResolve = async (promise, message) => {
    try{
        return await promise;
    }catch (e) {
        assert.fail(`${message}\n${e}`);
    }
};