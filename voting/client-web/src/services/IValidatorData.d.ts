/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

export interface IValidatorData {
  name: string;
  website: string;
  ipAddress: string;
  orbsAddress: string;
}

// DEV_NOTE : This interface is standing for the actual data that returns from
//            the remote endpoint.
// TODO : FUTURE : O.L : Add proper types from the remote api library.
interface IElectedValidatorData extends IValidatorData {
  stake: number;
}
