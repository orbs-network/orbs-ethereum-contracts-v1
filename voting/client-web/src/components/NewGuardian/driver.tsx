/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { NewGuardian } from './NewGuardian';
import { render, waitForElement, fireEvent } from 'react-testing-library';
import { BrowserRouter as Router } from 'react-router-dom';
import { IApiStrategy } from '../../api/interface';
import { ApiStrategyStub } from '../../api/stub';

export default class NewGuardianDriver {
  private renderResult;
  apiService: IApiStrategy;

  constructor() {
    this.apiService = new ApiStrategyStub({}, {});
  }

  setName(name) {
    const { getByTestId } = this.renderResult;
    const nameInput = getByTestId('name').querySelector('input');
    return fireEvent.change(nameInput, { target: { value: name } });
  }

  setWebsite(url) {
    const { getByTestId } = this.renderResult;
    const websiteInput = getByTestId('website').querySelector('input');
    return fireEvent.change(websiteInput, { target: { value: url } });
  }

  submit() {
    const { getByTestId } = this.renderResult;
    return getByTestId('submit').click();
  }

  async render() {
    this.renderResult = render(
      <Router>
        <NewGuardian apiService={this.apiService} />
      </Router>,
    );
    return this.renderResult;
  }
}
