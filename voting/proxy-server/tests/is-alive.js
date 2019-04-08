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

const chance = new Chance();

describe('Endpoint `/is_alive`', () => {
  let server, serverUrl;
  beforeAll(() => {
    const port = chance.integer({ min: 1000, max: 9999 });
    const config = {
      port,
      ethereum: {},
      orbs: {}
    };
    serverUrl = `http://localhost:${port}`;
    server = new ProxyServer(config);
    server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should return OK if the server is up', async () => {
    const res = await axios.get(`${serverUrl}/is_alive`);
    expect(res.status).toBe(200);
  });
});
