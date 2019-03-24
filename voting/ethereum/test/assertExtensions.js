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