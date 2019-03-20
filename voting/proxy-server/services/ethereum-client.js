const Web3 = require('web3');
const contractsInfo = require('../contracts-info');
const guardiansContractJSON = require('../contracts/OrbsGuardians.json');
const validatorsContractJSON = require('../contracts/OrbsValidators.json');
const validatorsRegistryContractJSON = require('../contracts/OrbsValidatorsRegistry.json');

class EthereumClientService {
  constructor(url) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(url));
    this.guardiansContract = new this.web3.eth.Contract(
      guardiansContractJSON.abi,
      contractsInfo.EthereumGuardiansContract.address
    );
    this.validatorsContract = new this.web3.eth.Contract(
      validatorsContractJSON.abi,
      contractsInfo.EthereumValidatorsContract.address
    );
    this.validatorsRegistryContract = new this.web3.eth.Contract(
      validatorsRegistryContractJSON.abi,
      contractsInfo.EthereumValidatorsRegistryContract.address
    );
  }
  getGuardians(offset, limit) {
    return this.guardiansContract.methods.getGuardians(offset, limit).call();
  }
  getGuardianData(address) {
    return this.guardiansContract.methods.getGuardianData(address).call();
  }
  getValidators() {
    return this.validatorsContract.methods.getValidators().call();
  }
  getValidatorData(address) {
    return this.validatorsRegistryContract.methods
      .getValidatorData(address)
      .call();
  }
}

module.exports = {
  EthereumClientService
};
