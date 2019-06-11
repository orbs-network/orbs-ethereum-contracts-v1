/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { GuardiansPage } from './GuardiansPage';
import { render, waitForElement } from 'react-testing-library';
import { BrowserRouter as Router } from 'react-router-dom';
import { IApiStrategy } from '../../api/interface';
import { ApiStrategyStub } from '../../api/stub';

export default class GuardiansDriver {
  private renderResult;
  apiService: IApiStrategy;

  constructor(data) {
    this.apiService = new ApiStrategyStub({}, data);
  }

  chooseValidator(address) {
    const el = this.renderResult.getByTestId(`validator-${address}-checkbox`);
    if (el !== null) {
      el.querySelector('input').click();
    }
  }

  async render() {
    this.renderResult = render(
      <Router>
        <GuardiansPage apiService={this.apiService} />
      </Router>,
    );
    const validatorsList = this.renderResult.getByTestId('validators-list');
    await waitForElement(() => validatorsList.children.length);

    return this.renderResult;
  }
}
