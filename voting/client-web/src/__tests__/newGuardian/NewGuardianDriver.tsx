/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render, fireEvent } from '@testing-library/react';
import { ApiContext } from '../../services/ApiContext';
import { IMetamask } from '../../services/IMetamask';
import { IRemoteService } from '../../services/IRemoteService';
import { MetamaskServiceMock } from '../../services/MetamaskServiceMock';
import { RemoteServiceMock } from '../../services/RemoteServiceMock';
import { NewGuardian } from '../../components/NewGuardian/NewGuardian';

export class NewGuardianDriver {
  public remoteService: IRemoteService;
  public metaMask: IMetamask;
  private renderResult;

  constructor() {
    this.remoteService = new RemoteServiceMock({}, {});
    this.metaMask = new MetamaskServiceMock();
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
        <ApiContext.Provider value={{ remoteService: this.remoteService, metamask: this.metaMask }}>
          <NewGuardian />
        </ApiContext.Provider>
      </Router>,
    );
    return this.renderResult;
  }
}
