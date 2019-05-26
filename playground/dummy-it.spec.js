/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
const Resolver = require("truffle-resolver");
const HDWalletProvider = require("truffle-hdwallet-provider");
const Contracts = require("truffle-workflow-compile");
const Web3 = require("web3");
const path = require("path");
const { expect } = require("chai");

describe("Ethereum Integration",  () => {
   it("supports requiring a simple contract and deploying a new version of it", async () => {
       const mnemonic = "vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid"
       const provider = new HDWalletProvider(mnemonic, "http://localhost:7545", 0, 10);
       const web3 = new Web3(provider);
       const accounts = await web3.eth.getAccounts()

       const config = {
           working_directory: path.resolve("."),
           contracts_directory: path.resolve(".", "contracts"), // dir where contracts are located
           contracts_build_directory: path.resolve(".", "build"),
           compilers: {
               solc: {
                   version: '0.5.0',       // Fetch exact version from solc-bin (default: truffle's version)
                   settings: {          // See the solidity docs for advice about optimization and evmVersion
                       optimizer: {
                           enabled: true,
                           runs: 200
                       }
                   }
               }
           },
       };

       await Contracts.compile(config)
           .then(() => console.log("Compilation complete!"))
           .catch(e => console.error(e))

       const resolver = new Resolver(config);

       const Echo = resolver.require('Echo');
       Echo.setProvider(provider);
       const echo = await Echo.new({from: accounts[0]});

       await echo.say("Foo", {from: accounts[0]});
       const said = await echo.ask();

       return expect(said).to.equal("Foo");
   });

   it("supports linking contracts");
});
