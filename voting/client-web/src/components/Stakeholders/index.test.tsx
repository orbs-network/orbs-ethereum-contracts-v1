import StakeholdersDriver from './driver';
import { generateGuardiansData } from './fixtures';
import { waitForElement, cleanup } from 'react-testing-library';

describe('Stakeholders Page', () => {
  let guardiansData, driver: StakeholdersDriver;

  beforeEach(() => {
    guardiansData = generateGuardiansData();
    driver = new StakeholdersDriver(guardiansData);
  });

  afterEach(cleanup);

  it('should render guardians', async () => {
    const { getByTestId } = driver.render();
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
    const delegateSpy = jest.spyOn(driver.apiService, 'delegate');
    const firstAddress = Object.keys(guardiansData)[0];

    const { getByTestId } = driver.render();
    const guardianList = getByTestId('guardians-list');
    await waitForElement(() => guardianList.children.length);

    getByTestId(`guardian-${firstAddress}`).click();

    await waitForElement(() => getByTestId('guardian-dialog'));

    await getByTestId('delegate-button').click();
    expect(delegateSpy).toHaveBeenCalledWith(firstAddress);
  });
});
