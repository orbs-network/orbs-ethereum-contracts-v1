const HDWalletProvider = require('truffle-hdwallet-provider');

// First address with Ether: 0x03818abd13919d26BE670B6523b5f76495F7f48f
const mnemonic = 'device traffic admit exist network cereal ordinary phrase equip flip creek anger';

module.exports = {
  networks: {
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/v3/4433cef5751c495291c38a2c8a082141'),
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
      version: '0.5.3',
    },
  },
};