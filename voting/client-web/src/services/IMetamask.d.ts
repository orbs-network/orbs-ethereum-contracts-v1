/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

export interface IMetamask {
  isMainNet(): boolean;
  displayOrbsInMetamask(): Promise<void>;
  getCurrentAddress(): Promise<string>;
  delegate(candidate: string): Promise<void>;
  voteOut(validators: string[]): Promise<void>;
  registerGuardian(info: IGuardianData): Promise<void>;
  registerValidator(info: IValidatorData): Promise<void>;
  getLastVote(): Promise<{ validators: string[] }>;
}
