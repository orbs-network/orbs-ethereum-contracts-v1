import GuardiansPageDriver from './driver';
import { generateValidatorsData } from './fixtures';
import { cleanup } from 'react-testing-library';

describe('Guardians Page', () => {
  let driver: GuardiansPageDriver, validatorsData;

  beforeEach(() => {
    validatorsData = generateValidatorsData();
    driver = new GuardiansPageDriver(validatorsData);
  });

  afterEach(cleanup);

  it('should render the list', async () => {
    const { getByTestId } = await driver.render();
    const validatorsList = getByTestId('validators-list');

    expect(validatorsList.children.length).toEqual(
      Object.keys(validatorsData).length
    );

    Object.keys(validatorsData).forEach(address => {
      expect(getByTestId(`validator-${address}-name`)).toContainHTML(
        validatorsData[address].name
      );
      expect(getByTestId(`validator-${address}-address`)).toContainHTML(
        address
      );
      expect(getByTestId(`validator-${address}-url`)).toContainHTML(
        validatorsData[address].website
      );
    });
  });

  it('should have vote out button disabled', async () => {
    const { getByTestId } = await driver.render();
    expect(getByTestId('vote-button')).toBeDisabled();
  });

  it('should have keep everyone button enabled', async () => {
    const { getByTestId } = await driver.render();
    expect(getByTestId('leave-everyone-button')).not.toBeDisabled();
  });

  it('should change buttons disabled status on check', async () => {
    const { getByTestId } = await driver.render();

    const firstAddress = Object.keys(validatorsData)[0];
    driver.chooseValidator(firstAddress);

    expect(getByTestId('vote-button')).not.toBeDisabled();
    expect(getByTestId('leave-everyone-button')).toBeDisabled();
  });

  it('should vote out with chosen addresses', async () => {
    const spy = jest.spyOn(driver.apiService, 'voteOut');

    const { getByTestId } = await driver.render();

    const firstAddress = Object.keys(validatorsData)[0];
    driver.chooseValidator(firstAddress);

    await getByTestId('vote-button').click();
    expect(spy).toHaveBeenCalledWith([firstAddress]);
  });

  it('should vote out with empty list', async () => {
    const spy = jest.spyOn(driver.apiService, 'voteOut');
    const { getByTestId } = await driver.render();
    await getByTestId('leave-everyone-button').click();
    expect(spy).toHaveBeenCalledWith([]);
    spy.mockRestore();
  });
});
