import React from 'react';
import DelegatorsPage from './index';
import { render } from 'react-testing-library';
import { ApiStrategyStub } from '../../api/stub';
import { IApiStrategy } from '../../api/interface';
import { BrowserRouter as Router } from 'react-router-dom';

export default class DelegatorsDriver {
  apiService: IApiStrategy;
  constructor(data) {
    this.apiService = new ApiStrategyStub(data, {});
  }
  render() {
    return render(
      <Router>
        <DelegatorsPage apiService={this.apiService} />
      </Router>
    );
  }
}
