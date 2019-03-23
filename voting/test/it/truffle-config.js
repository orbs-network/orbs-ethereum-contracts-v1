const helpers = require("./truffle-scripts/helpers");

const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic_ropsten = process.env.ROPSTEN_SECRET;
const mnemonic_mainnet = process.env.MAINNET_SECRET;

const mainnet_url = process.env.MAINNET_URL;
const ropsten_url = process.env.ROPSTEN_URL;

const accounts = 25;

module.exports = {
  networks: {
    mainnet: {
      provider: () => new HDWalletProvider(mnemonic_mainnet, mainnet_url, 0, accounts),
      network_id: '1',
      gasPrice: helpers.GAS_PRICE,
    },
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic_ropsten, ropsten_url, 0, accounts),
      network_id: '3',
      gasPrice: helpers.GAS_PRICE
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '5777',
      accounts: accounts,
      gasPrice: helpers.GAS_PRICE,
    },
  },
  compilers: {
    solc: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      version: '0.4.25',       // Fetch exact version from solc-bin (default: truffle's version)
    },
  },
};
