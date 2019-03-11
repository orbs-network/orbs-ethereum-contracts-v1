import React from 'react';
import GuardiansPage from './index';
import { render } from 'react-testing-library';
import { BrowserRouter as Router } from 'react-router-dom';

export default class GuardiansDriver {
  withValidatorsContract(data) {
    return {
      methods: {
        getValidators() {
          return {
            call() {
              return Object.keys(data);
            }
          };
        }
      }
    };
  }
  withValidatorsRegistryContract(data) {
    return {
      methods: {
        getValidatorData(address) {
          return {
            call() {
              return data[address];
            }
          };
        }
      }
    };
  }
  withVotingContract() {
    return {
      methods: {
        vote(validators) {
          return {
            send() {
              console.log(`Voted for ${validators}`);
              return true;
            }
          };
        }
      }
    };
  }
  withMetamaskService() {
    return {
      enable() {
        return 'some-fake-address';
      }
    };
  }
  renderWithData(data) {
    const props = {
      validatorsContract: this.withValidatorsContract(data),
      validatorsRegistryContract: this.withValidatorsRegistryContract(data),
      votingContract: this.withVotingContract(),
      metamaskService: this.withMetamaskService()
    };
    return render(
      <Router>
        <GuardiansPage {...props} />
      </Router>
    );
  }
}
