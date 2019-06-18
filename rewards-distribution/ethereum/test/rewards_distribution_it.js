/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const OrbsRewardsDistribution = artifacts.require('./OrbsRewardsDistribution');
const Erc20 = artifacts.require('./TestingERC20');


contract('OrbsRewardsDistribution', accounts => {
    const owner = accounts[0];

    it('distributes rewards specified in rewards report', async () => {
        const erc20 = await Erc20.new();
        const instance = await OrbsRewardsDistribution.new(erc20.address, { from: owner });
        expect(instance).to.exist;
        
        // parse input file
        
        // verify no duplicate recipient
        
        // split to batches
        
        // calculate batch hashes
        
        // announce distribution event with hash batches
        
        // transfer tokens to contract
        
        // execute all batches
        
        // check events
    });
});