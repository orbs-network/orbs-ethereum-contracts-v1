import { StakeholdersDriver } from './driver';
import { generateGuardiansData } from './fixtures';
import { waitForElement, cleanup } from 'react-testing-library';

describe('Stakeholders components', () => {
  let guardiansData, driver: StakeholdersDriver;

  beforeEach(() => {
    guardiansData = generateGuardiansData();
    driver = new StakeholdersDriver();
  });

  afterEach(cleanup);

  it('should render guardians', async () => {
    const { getByRole, getByTestId } = driver.renderWithData(guardiansData);
    const radiogroup = getByRole('radiogroup');

    await waitForElement(() => radiogroup.children.length);

    expect(radiogroup.children.length).toEqual(
      Object.keys(guardiansData).length
    );

    Object.keys(guardiansData).forEach(address => {
      expect(getByTestId(`guardian-${address}-label`)).toHaveAttribute(
        'href',
        guardiansData[address].website
      );
      expect(getByTestId(`guardian-${address}-label`).innerHTML).toEqual(
        guardiansData[address].name
      );
    });
  });

  it('delegate should be disabled if nothing is selected', () => {
    const { getByTestId } = driver.renderWithData(guardiansData);
    expect(getByTestId('delegate-button')).toBeDisabled();
  });

  it('should delegate to a selected candidate', async () => {
    const props = {
      guardiansContract: driver.withGuardiansContract(guardiansData),
      votingContract: driver.withVotingContract(),
      metamaskService: driver.withMetamaskService()
    };
    const delegateSpy = jest.spyOn(props.votingContract.methods, 'delegate');
    const firstAddress = Object.keys(guardiansData)[0];
    const { getByTestId, getByValue } = driver.renderWithProps(props);
    await waitForElement(() => getByValue(firstAddress));
    getByValue(firstAddress).click();
    getByTestId('delegate-button').click();
    expect(delegateSpy).toHaveBeenCalledWith(firstAddress);
  });
});
