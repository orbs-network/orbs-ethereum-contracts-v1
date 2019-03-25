const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic_ropsten = process.env.ROPSTEN_SECRET;
const mnemonic_mainnet = process.env.MAINNET_SECRET;

const mainnet_url = process.env.MAINNET_URL;
const ropsten_url = process.env.ROPSTEN_URL;

module.exports = {
  contracts_build_directory: "../ethereum/build/contracts",
  contracts_directory: "../ethereum/contracts",
  networks: {
    mainnet: {
      provider: () => new HDWalletProvider(mnemonic_mainnet, mainnet_url, 0, 25),
      network_id: '1',
      gasPrice: 300000000,
    },
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic_ropsten, ropsten_url, 0, 25),
      network_id: '3',
      gasPrice: 300000000
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '5777',
      accounts: 25,
      gasPrice: 1,
    },
  },
  compilers: {
    solc: {
      version: '0.4.25',
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "byzantium"
      }
    }
  }
};
