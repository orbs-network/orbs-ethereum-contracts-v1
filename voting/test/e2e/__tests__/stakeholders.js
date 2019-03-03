const Web3 = require('web3');
const { setup, tearDown } = require('../src');
const { GANACHE_PORT } = require('../src/ganache');

describe('Stakeholders', () => {
  let page, browser, web3;

  beforeAll(async () => {
    const s = await setup();
    page = s.page;
    browser = s.page;
    web3 = new Web3(`http://localhost:${GANACHE_PORT}`);
  });

  it('should have correct title', async () => {
    await expect(page.title()).resolves.toMatch('Orbs Voting');
  });

  it('should delegate to the first guardian', async () => {
    await page
      .waitForSelector('a[data-hook="nav-stakeholder"]')
      .then(el => el.click());
    
    await page.waitForSelector('input[name="candidate"]').then(el => el.click());

    await page.$('*[data-hook="delegate-button"]').then(el => el.click());

    const pages = await browser.pages();
    console.log(pages);
    
    await page.waitForSelector('.btn-confirm').then(el => el.click());

    const logs = web3.eth.getPastLogs({ flomBlock: 0 });
    console.log(logs);
  });

  afterAll(async () => {
    await tearDown();
  });
});
