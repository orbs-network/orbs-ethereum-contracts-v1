/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { DelegatorsPage } from './DelegatorsPage';
import { render } from 'react-testing-library';
import { ApiStrategyStub } from '../../api/stub';
import { IApiStrategy } from '../../api/interface';
import { BrowserRouter as Router } from 'react-router-dom';

export class DelegatorsDriver {
  apiService: IApiStrategy;
  constructor(data) {
    this.apiService = new ApiStrategyStub(data, {});
  }
  render() {
    return render(
      <Router>
        <DelegatorsPage apiService={this.apiService} />
      </Router>,
    );
  }
}
