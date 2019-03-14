import React from 'react';
import GuardiansPage from './index';
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
      </Router>
    );
    const validatorsList = this.renderResult.getByTestId('validators-list');
    await waitForElement(() => validatorsList.children.length);

    return this.renderResult;
  }
}
