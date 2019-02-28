const util = require('util');
const puppeteer = require('puppeteer');
const staticServer = require('./static-server');
const metamask = require('./metamask-extension');
const contracts = require('./contracts');
const ganache = require('./ganache');

let containerId, staticServerProcess, browser;

/**
 * Setup
 * 1. Build client code & copy it to e2e folder
 * 2. Clone & build metamask-extension
 * 3. Start Ganache
 * 4. Deploy contracts
 * 5. Start static server
 * 6. Configure metamask extension
 * 7. Inject contract addresses to voting page
 *
 */
const setup = async () => {
  // await util.promisify(exec)('./scripts/build-client.sh');
  // await util.promisify(exec)('./scripts/build-metamask.sh');
  containerId = await ganache.start();
  const contractAddresses = await contracts.deploy();
  staticServerProcess = staticServer.start();

  browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-extensions-except=metamask-extension/dist/chrome',
      '--load-extension=metamask-extension/dist/chrome'
    ]
  });
  const votingPage = await browser.newPage();
  await votingPage.evaluateOnNewDocument(OrbsContractsInfo => {
    window['__OrbsContractsInfo__'] = OrbsContractsInfo;
  }, contractAddresses);
  
  await votingPage.goto(`http://localhost:${staticServer.PORT}/voting`, {
    waitUntil: 'networkidle2'
  });

  await metamask.configure(browser);
  await votingPage.bringToFront();
};

const tearDown = async () => {
  await browser.close();
  await staticServerProcess.kill();
  await ganache.stop(containerId);
};

module.exports = { setup, tearDown };
