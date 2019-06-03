/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */
const Resolver = require("truffle-resolver");
const Deployer = require("truffle-deployer");
const HDWalletProvider = require("truffle-hdwallet-provider");
const Contracts = require("truffle-workflow-compile");
const Web3 = require("web3");
const path = require("path");
const {expect} = require("chai");

describe("Ethereum Integration", () => {
    const mnemonic = "vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid"
    const provider = new HDWalletProvider(mnemonic, "http://localhost:7545", 0, 10);
    const web3 = new Web3(provider);

    const config = {
        working_directory: path.resolve("."),
        contracts_directory: path.resolve(".", "contracts"), // dir where contracts are located
        contracts_build_directory: path.resolve(".", "build"),
        compilers: {
            solc: {
                version: '0.4.25',       // Fetch exact version from solc-bin (default: truffle's version)
                settings: {          // See the solidity docs for advice about optimization and evmVersion
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }
        },
        provider
    };

    before(async () => {
        await Contracts.compile(config);
        const networkId = await web3.eth.net.getId();
        config.network_id = networkId;
    });

    after(() => {
        provider.engine.stop(); // otherwise the tests do not terminate on error
    });

    it("supports requiring a simple contract and deploying a new version of it", async () => {
        const accounts = await web3.eth.getAccounts();
        const resolver = new Resolver(config);

        const Echo = resolver.require('Echo');
        Echo.defaults({from: accounts[0]});
        const echo = await Echo.new();

        await echo.say("Foo");
        const said = await echo.ask();

        return expect(said).to.equal("Foo");

    });

    it("supports linking contracts", async () => {
        const accounts = await web3.eth.getAccounts();
        const resolver = new Resolver(config);

        const Echo = resolver.require('Echo');
        Echo.defaults({from: accounts[0]});
        const echo = await Echo.new();

        await echo.say("foo");
        const said = await echo.ask();

        return expect(said).to.equal("bar");
    });

    it("supports dependencies from external modules", async () => {
        const accounts = await web3.eth.getAccounts();
        const resolver = new Resolver(config);

        const DateTime = resolver.require("subscription/contracts/DateTime.sol");
        DateTime.defaults({from: accounts[0]});

        const LeapYear = resolver.require("LeapYear");
        LeapYear.defaults({from: accounts[0]});

        const deployer = new Deployer({
            networks: {test: {}},
            network: "test",
            network_id: config.network_id,
            provider,
            contracts: [DateTime, LeapYear]
        });
        await deployer.start();
        await deployer.then(async () => {
            const d = await deployer.deploy(DateTime);
            deployer.link(DateTime, LeapYear);
            await deployer.deploy(LeapYear);
        });

        const leapYear = await LeapYear.deployed();

        expect(await leapYear.isLeapYear(2020)).to.be.true;
        expect(await leapYear.isLeapYear(2021)).to.be.false;
    });
});
