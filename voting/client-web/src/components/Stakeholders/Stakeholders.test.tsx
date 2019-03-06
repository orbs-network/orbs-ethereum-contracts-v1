import React from 'react';
import Stakeholders from './index';
import { StakeholdersDriver } from './driver';
import { generateGuardiansData } from './fixtures';
import { render, waitForElement } from 'react-testing-library';

describe('Stakeholders components', () => {
  let container, guardiansData, driver: StakeholdersDriver;

  beforeEach(() => {
    guardiansData = generateGuardiansData();
    driver = new StakeholdersDriver();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should render guardians', async () => {
    const props = {
      guardiansContract: driver.given.guardiansContract(guardiansData),
      votingContract: driver.given.votingContract(),
      metamaskService: driver.given.metamaskService()
    };

    const { getByRole, getByTestId } = render(<Stakeholders {...props} />);
    const radiogroup = getByRole('radiogroup');

    await waitForElement(() => radiogroup.children.length);

    expect(radiogroup.children.length).toEqual(
      Object.keys(guardiansData).length
    );

    Object.keys(guardiansData).forEach(address => {
      expect(getByTestId(`guardian-${address}-label`)['href']).toEqual(
        guardiansData[address].website
      );
      expect(getByTestId(`guardian-${address}-label`).innerHTML).toEqual(
        guardiansData[address].name
      );
    });
  });

  it('delegate should be disabled if nothing is selected', () => {
    const props = {
      guardiansContract: driver.given.guardiansContract(guardiansData),
      votingContract: driver.given.votingContract(),
      metamaskService: driver.given.metamaskService()
    };
  });
});
