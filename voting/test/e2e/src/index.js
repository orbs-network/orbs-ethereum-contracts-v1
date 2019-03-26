/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const ganache = require('./ganache');
const puppeteer = require('puppeteer');
const contracts = require('./contracts');
const staticServer = require('./static-server');
const metamask = require('./metamask-extension');

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
 */
const setup = async () => {
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

  return { page: votingPage, browser };
};

const tearDown = async () => {
  await browser.close();
  await staticServerProcess.kill();
};

module.exports = { setup, tearDown };
