import React from 'react';
import StakeholdersPage from './index';
import { render } from 'react-testing-library';
import { ApiStrategyStub } from '../../api/stub';
import { IApiStrategy } from '../../api/interface';
import { BrowserRouter as Router } from 'react-router-dom';

export default class StakeholdersDriver {
  apiService: IApiStrategy;
  constructor(data) {
    this.apiService = new ApiStrategyStub(data, {});
  }
  render() {
    return render(
      <Router>
        <StakeholdersPage apiService={this.apiService} />
      </Router>
    );
  }
}
