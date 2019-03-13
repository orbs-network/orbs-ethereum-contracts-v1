import React from 'react';
import GuardiansPage from './index';
import { render } from 'react-testing-library';
import { BrowserRouter as Router } from 'react-router-dom';
import { IApiStrategy } from '../../api/interface';
import { ApiStrategyStub } from '../../api/stub';

export default class GuardiansDriver {
  apiService: IApiStrategy;
  constructor(data) {
    this.apiService = new ApiStrategyStub({}, data);
  }
  render() {
    return render(
      <Router>
        <GuardiansPage apiService={this.apiService} />
      </Router>
    );
  }
}
