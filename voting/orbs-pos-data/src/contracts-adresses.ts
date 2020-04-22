/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
export interface IOrbsPosContractsAddresses {
  guardiansContract: string;
  votingContract: string;
  orbsRewardsDistributionContract: string;
  validatorsContract: string;
  validatorsRegistryContract: string;
  erc20Contract: string;
}

export const MainnetContractsAddresses: IOrbsPosContractsAddresses = {
  guardiansContract: '0xD64B1BF6fCAb5ADD75041C89F61816c2B3d5E711',
  votingContract: '0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d',
  orbsRewardsDistributionContract: '0xb2969e54668394bcA9B8AF61bC39B92754b7A7a0',
  validatorsContract: '0x240fAa45557c61B6959162660E324Bb90984F00f',
  validatorsRegistryContract: '0x56A6895FD37f358c17cbb3F14A864ea5Fe871F0a',
  erc20Contract: '0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA',
};

export const STAKING_CONTRACT_ADDRESS = '0x01D59Af68E2dcb44e04C50e05F62E7043F2656C3';
