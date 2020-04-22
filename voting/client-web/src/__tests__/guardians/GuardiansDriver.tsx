/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render, waitForElement } from '@testing-library/react';
import { ApiContext } from '../../services/ApiContext';
import { IMetamask } from '../../services/IMetamask';
import { IRemoteService } from '../../services/IRemoteService';
import { MetamaskServiceMock } from '../../services/MetamaskServiceMock';
import { RemoteServiceMock } from '../../services/RemoteServiceMock';
import { GuardiansPage } from '../../components/Guardrians/GuardiansPage';

export class GuardiansDriver {
  private renderResult;
  public remoteService: IRemoteService;
  public metaMask: IMetamask;

  constructor(data) {
    this.remoteService = new RemoteServiceMock({}, data);
    this.metaMask = new MetamaskServiceMock();
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
        <ApiContext.Provider value={{ remoteService: this.remoteService, metamask: this.metaMask }}>
          <GuardiansPage />
        </ApiContext.Provider>
      </Router>,
    );
    const validatorsList = this.renderResult.getByTestId('validators-list');
    await waitForElement(() => validatorsList.children.length);

    return this.renderResult;
  }
}
