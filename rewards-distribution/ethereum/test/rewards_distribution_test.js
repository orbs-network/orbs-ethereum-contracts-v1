/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const OrbsRewardsDistribution = artifacts.require('./OrbsRewardsDistribution');


contract('OrbsRewardsDistribution', accounts => {
    const owner = accounts[0];

    it('deploys contract successfully', async () => {
        const instance = await OrbsRewardsDistribution.new({ from: owner });
        expect(instance).to.exist;
    });
});