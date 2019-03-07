import React from 'react';
import Stakeholders from './index';
import { render } from 'react-testing-library';

export class StakeholdersDriver {
  withMetamaskService() {
    return {
      enable() {
        return 'some-fake-address';
      }
    };
  }
  withVotingContract() {
    return {
      methods: {
        delegate(...args) {
          return {
            send({ from }) {
              console.log(`Sent from ${from} with following arguments ${args}`);
              return true;
            }
          };
        }
      }
    };
  }
  withGuardiansContract(data) {
    return {
      methods: {
        getGuardians() {
          return {
            call() {
              return Object.keys(data);
            }
          };
        },
        getGuardianData(address) {
          return {
            call() {
              return data[address];
            }
          };
        }
      }
    };
  }
  renderWithData(guardiansData) {
    const props = {
      guardiansContract: this.withGuardiansContract(guardiansData),
      votingContract: this.withVotingContract(),
      metamaskService: this.withMetamaskService()
    };
    return this.renderWithProps(props);
  }
  renderWithProps(props) {
    return render(<Stakeholders {...props} />);
  }
}
