const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic = process.env.ROPSTEN_SECRET;

module.exports = {
  networks: {
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, process.env.ROPSTEN_INFURA_URL, 0, 10),
      network_id: '3',
    },
    ganache: {
      host: 'ganache',
      port: 7545,
      network_id: '5777',
    },
  },
  compilers: {
    solc: {
      version: '0.4.24',
    },
  },
};