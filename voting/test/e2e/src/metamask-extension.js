const seed =
  'tribe put reopen burden token leisure wish tiny drift plunge birth danger';

const configure = async browser => {
  let pages = await browser.pages();

  // close pop-up window
  for (let i = 0; i < pages.length; i++) {
    const title = await pages[i].title();
    if (title === 'MetaMask Notification') {
      pages[i].close();
    }
  }

  pages = await browser.pages();
  const metamaskPage = pages[pages.length - 1];

  await metamaskPage
    .waitForSelector('.first-time-flow__button')
    .then(el => el.click());

  // import account
  await metamaskPage
    .waitForSelector('.create-password__import-link')
    .then(el => el.click());

  // enter seed and passwords
  await metamaskPage.waitForSelector('.first-time-flow__textarea');
  await metamaskPage.focus('.first-time-flow__textarea');
  await metamaskPage.keyboard.type(seed);
  await metamaskPage.focus('input[id="password"]');
  await metamaskPage.keyboard.type('12345678');
  await metamaskPage.focus('input[id="confirm-password"]');
  await metamaskPage.keyboard.type('12345678');
  await metamaskPage
    .waitForSelector('.first-time-flow__button')
    .then(el => el.click());

  // agree on terms and conditions
  await metamaskPage.waitForSelector('.first-time-flow__markdown');
  await metamaskPage.$eval('.first-time-flow__markdown', el =>
    el.scrollBy(0, 10001)
  );
  await metamaskPage
    .waitForSelector('.first-time-flow__button')
    .then(el => el.click());
  await metamaskPage.waitFor(500);
  await metamaskPage
    .waitForSelector('.first-time-flow__button')
    .then(el => el.click());
  await metamaskPage.waitFor(500);
  await metamaskPage
    .waitForSelector('.first-time-flow__button')
    .then(el => el.click());
  await metamaskPage.waitFor(500);

  // choose the local network
  await metamaskPage
    .waitForSelector('.network-component')
    .then(el => el.click());
  const [localNetwork] = await metamaskPage.$x(
    "//span[contains(text(), 'Localhost 8545')]"
  );
  await localNetwork.click();

  await metamaskPage.waitForSelector('.btn-confirm').then(el => el.click());
};

module.exports = { configure, seed };
