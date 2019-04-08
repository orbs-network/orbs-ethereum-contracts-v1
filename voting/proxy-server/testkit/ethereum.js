/**
 * Copyright 2019 the web3.js-testkit
 * This file is part of the web3.js-testkit library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const express = require('express');
const { promisify } = require('util');
const bodyParser = require('body-parser');
const { AbiCoder } = require('web3-eth-abi');

class Web3Testkit {
  constructor(config) {
    this.port = config.port;
    this._expressApp = express();
    this._abiCoder = new AbiCoder();
    this._expressApp.use(bodyParser.json());
    this._abis = {};
    this._responses = {};
  }

  normalizeAddress(address) {
    return address.toLowerCase();
  }

  _findMethodAbiBy(address, key, value) {
    return this._abis[address].find(abi => abi[key] === value);
  }

  setABI(contractAddress, abi) {
    const address = this.normalizeAddress(contractAddress);
    this._abis[address] = abi;
  }

  removeABI(contractAddress) {
    const address = this.normalizeAddress(contractAddress);
    this._abis[address] = undefined;
  }

  setResponse(contractAddress, contractMethodName, data) {
    const address = this.normalizeAddress(contractAddress);
    const methodABI = this._findMethodAbiBy(
      address,
      'name',
      contractMethodName
    );
    if (!this._responses[address]) {
      this._responses[address] = {};
    }
    this._responses[address][methodABI.signature] = data;
  }

  _rpcResponse(req, res) {
    const contractAddress = req.body.params[0].to;
    const methodSignature = req.body.params[0].data.slice(0, 10);
    const data = this._responses[contractAddress][methodSignature];
    const methodABI = this._findMethodAbiBy(
      contractAddress,
      'signature',
      methodSignature
    );

    const response = {
      id: req.body.id,
      jsonrpc: req.body.jsonrpc,
      result: this._abiCoder.encodeParameter(methodABI.outputs[0].type, data)
    };

    res.json(response);
  }

  start() {
    this._expressApp.post('/', (req, res) => this._rpcResponse(req, res));
    this.server = this._expressApp.listen(this.port, () => {
      console.log(`Web3 teskit server started on port ${this.port}!`);
    });
  }

  stop() {
    this._abis = {};
    this._responses = {};
    return promisify(this.server.close)();
  }
}

module.exports = Web3Testkit;
