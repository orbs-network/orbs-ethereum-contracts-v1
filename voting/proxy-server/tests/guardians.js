/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const axios = require('axios');
const Chance = require('chance');
const ProxyServer = require('../src/server');
const Web3Testkit = require('../testkit/ethereum');

const contractsInfo = require('../src/contracts-info');
const guardiansContractInfo = require('../src/contracts/OrbsGuardians.json');

const chance = new Chance();

const createRandomAddress = () => `0x${chance.hash({ lenght: 20 })}`;
const createRandomPort = () => chance.integer({ min: 1000, max: 9999 });

describe('Endpoint `/api/guardians`', () => {
  let proxyServer, web3TestkitServer, serverUrl, guardians;
  beforeAll(() => {
    const PROXY_SERVER_PORT = createRandomPort();
    const ETHEREUM_PROVIDER_PORT = createRandomPort();

    serverUrl = `http://localhost:${PROXY_SERVER_PORT}`;
    const web3TestkitServerUrl = `http://localhost:${ETHEREUM_PROVIDER_PORT}`;

    const config = {
      port: PROXY_SERVER_PORT,
      ethereum: {
        providerUrl: web3TestkitServerUrl
      },
      orbs: {}
    };
    web3TestkitServer = new Web3Testkit({ port: ETHEREUM_PROVIDER_PORT });
    proxyServer = new ProxyServer(config);

    web3TestkitServer.setABI(
      contractsInfo.EthereumGuardiansContract.address,
      guardiansContractInfo.abi
    );

    web3TestkitServer.start();
    proxyServer.start();
  });

  afterAll(async () => {
    await proxyServer.stop();
    await web3TestkitServer.stop();
  });

  it('should return the list of guardians', async () => {
    const amountOfValidators = 6;
    guardians = Array.from(Array(amountOfValidators), () =>
      createRandomAddress()
    );
    web3TestkitServer.setResponse(
      contractsInfo.EthereumGuardiansContract.address,
      'getGuardians',
      guardians
    );
    const { data } = await axios.get(`${serverUrl}/api/guardians`, {
      params: {
        offset: 0,
        limit: 100
      }
    });
    expect(data.map(web3TestkitServer.normalizeAddress)).toEqual(guardians);
  });
});
