
module.exports.assertReject = async (promise, message) => {
    try{
        await promise;
        assert.fail(message);
    }catch (e) {
        return e;
    }
};

module.exports.assertResolve = async (promise, message) => {
    try{
        return await promise;
    }catch (e) {
        assert.fail(message);
    }
};