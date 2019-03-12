import GuardiansPageDriver from './driver';
import { generateValidatorsData } from './fixtures';
import { waitForElement, cleanup } from 'react-testing-library';

describe('Guardians Page', () => {
  let driver: GuardiansPageDriver, validatorsData;

  beforeEach(() => {
    validatorsData = generateValidatorsData();
    driver = new GuardiansPageDriver(validatorsData);
  });

  afterEach(cleanup);

  it('should render the list', async () => {
    const { getByTestId } = driver.render();
    const validatorsList = getByTestId('validators-list');
    await waitForElement(() => validatorsList.children.length);

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
});
