import { AppDriver } from './AppDriver';
import { cleanup } from 'react-testing-library';

describe('App component', () => {
  let driver: AppDriver;

  beforeEach(() => {
    driver = new AppDriver();
    window['ethereum'] = {};
  });

  afterEach(cleanup);

  it('should render header and main', () => {
    window['ethereum'] = {};
    const { getByTestId, queryByTestId } = driver.render();
    expect(getByTestId('header')).toBeVisible();
    expect(getByTestId('main')).toBeVisible();
    expect(getByTestId('container')).not.toContainElement(queryByTestId('read-only-banner'));
  });

  it('should render read-only banner if no metamask', () => {
    window['ethereum'] = undefined;
    const { getByTestId } = driver.render();
    expect(getByTestId('read-only-banner')).toBeVisible();
  });
});
