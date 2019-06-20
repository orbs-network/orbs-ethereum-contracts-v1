/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */


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
        assert.fail(message);
    }
};

module.exports.expectRevert = async (promise) => {
    try {
        await promise;
    } catch (error) {
        // TODO: Check jump destination to distinguish between a throw and an actual invalid jump.
        const invalidOpcode = error.message.search('invalid opcode') > -1;
        const revert = error.message.search('revert') > -1;

        // TODO: When we contract A calls contract B, and B throws, instead of an 'invalid jump', we get an 'out of gas'
        // error. How do we distinguish this from an actual out of gas event? The ganache log actually shows an 'invalid
        // jump' event).
        const outOfGas = error.message.search('out of gas') > -1;

        assert(invalidOpcode || revert || outOfGas, `Expected revert, got ${error} instead`);

        return;
    }

    assert(false, "Expected revert wasn't received");
};
