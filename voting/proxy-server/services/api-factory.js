const { OrbsClientService } = require('./orbs-client');
const { EthereumClientService } = require('./ethereum-client');
const ApiService = require('./api-service');

const virtualChainId = 1100000;
const orbsNodeAddress = '18.197.127.2';
const ethereumProviderUrl =
  process.env.ETHEREUM_PROVIDER_URL ||
  'https://ropsten.infura.io/v3/4433cef5751c495291c38a2c8a082141';

const ethereumClient = new EthereumClientService(ethereumProviderUrl);

const orbsClientService = new OrbsClientService(
  orbsNodeAddress,
  virtualChainId
);

module.exports = {
  genApiService: () => new ApiService(ethereumClient, orbsClientService)
};
