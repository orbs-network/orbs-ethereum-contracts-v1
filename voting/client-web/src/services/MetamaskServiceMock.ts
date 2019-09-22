/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { IMetamask } from './IMetamask';
import { IGuardianData } from './IGuardianData';
import { IValidatorData } from './IValidatorData';

export class MetamaskServiceMock implements IMetamask {
  constructor() {}

  isMainNet(): boolean {
    return false;
  }

  async getCurrentAddress(): Promise<string> {
    return 'some-fake-addreess';
  }

  async displayOrbsInMetamask(): Promise<void> {}

  async delegate(candidate: string): Promise<void> {}

  async voteOut(validators: string[]): Promise<void> {}

  async registerGuardian(info: IGuardianData): Promise<void> {}

  async registerValidator(info: IValidatorData): Promise<void> {}

  async getLastVote(): Promise<{ validators: string[] }> {
    return { validators: [] };
  }
}
