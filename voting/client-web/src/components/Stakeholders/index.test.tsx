import { StakeholdersDriver } from './driver';
import { generateGuardiansData } from './fixtures';
import { waitForElement, cleanup } from 'react-testing-library';

describe('Stakeholders Page', () => {
  let guardiansData, driver: StakeholdersDriver;

  beforeEach(() => {
    guardiansData = generateGuardiansData();
    driver = new StakeholdersDriver();
  });

  afterEach(cleanup);

  it('should render guardians', async () => {
    const { getByTestId } = driver.renderWithData(guardiansData);
    const guardianList = getByTestId('guardians-list');

    await waitForElement(() => guardianList.children.length);

    expect(guardianList.children.length).toEqual(
      Object.keys(guardiansData).length
    );

    Object.keys(guardiansData).forEach(address => {
      expect(getByTestId(`guardian-${address}-name`)).toContainHTML(
        guardiansData[address].name
      );
      expect(getByTestId(`guardian-${address}-address`)).toContainHTML(address);
      expect(getByTestId(`guardian-${address}-url`)).toContainHTML(
        guardiansData[address].website
      );
    });
  });

  it('should delegate to a selected candidate', async () => {
    const props = {
      guardiansContract: driver.withGuardiansContract(guardiansData),
      votingContract: driver.withVotingContract(),
      metamaskService: driver.withMetamaskService()
    };
    const delegateSpy = jest.spyOn(props.votingContract.methods, 'delegate');
    const firstAddress = Object.keys(guardiansData)[0];

    const { getByTestId } = driver.renderWithProps(props);
    const guardianList = getByTestId('guardians-list');
    await waitForElement(() => guardianList.children.length);

    getByTestId(`guardian-${firstAddress}`).click();

    await waitForElement(() => getByTestId('guardian-dialog'));

    await getByTestId('delegate-button').click();
    expect(delegateSpy).toHaveBeenCalledWith(firstAddress);
  });
});
