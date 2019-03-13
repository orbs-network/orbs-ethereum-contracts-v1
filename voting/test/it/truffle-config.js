const HDWalletProvider = require('truffle-hdwallet-provider');

const mnemonic = process.env.ROPSTEN_SECRET;

module.exports = {
  networks: {
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, process.env.ROPSTEN_URL, 0, 25),
      network_id: '3',
    },
    ganache: {
      host: 'localhost',
      port: 7545,
      network_id: '5777',
      accounts: 25,
    },
  },
  compilers: {
    solc: {
      version: '0.5.3',
    },
  },
};
