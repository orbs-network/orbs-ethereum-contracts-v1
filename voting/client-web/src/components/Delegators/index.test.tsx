import DelegatorsDriver from './driver';
import { generateGuardiansData } from './fixtures';
import { waitForElement, cleanup, fireEvent } from 'react-testing-library';

describe('Delegators Page', () => {
  let guardiansData, driver: DelegatorsDriver;

  beforeEach(() => {
    guardiansData = generateGuardiansData();
    driver = new DelegatorsDriver(guardiansData);
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

  it('should be able to delegate manually', async () => {
    const delegateSpy = jest.spyOn(driver.apiService, 'delegate');
    const address = '0xa8F0f2A5D6E3799D5a0Bed1d1B3C61d21B163EFD';

    const { getByTestId } = driver.render();
    const guardianList = getByTestId('guardians-list');
    await waitForElement(() => guardianList.children.length);

    getByTestId(`open-manual-delegation-dialog`).click();

    await waitForElement(() => getByTestId('manual-delegation-dialog'));

    fireEvent.change(
      getByTestId('delegate-address-field').querySelector('input')!,
      { target: { value: address } }
    );

    await getByTestId('delegate-button').click();

    expect(delegateSpy).toHaveBeenCalledWith(address);
  });
});
