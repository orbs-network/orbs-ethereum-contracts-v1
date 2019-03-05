module.exports = async function(done) {
  try {

    const validatorsRegistry = artifacts.require('OrbsValidatorsRegistry');
    let instanceValidatorsRegistry = await validatorsRegistry.new(20);

    const validators = artifacts.require('OrbsValidators');
    let instanceValidators = await validators.new(instanceValidatorsRegistry.address, 20);

    console.log(JSON.stringify({
      ValidatorsAddress: instanceValidators.address,
      ValidatorsRegistryAddress: instanceValidatorsRegistry.address
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
