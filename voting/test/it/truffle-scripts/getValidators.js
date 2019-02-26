const validatorsContractAddress = process.env.VALIDATORS_CONTRACT_ADDRESS;

module.exports = async function(done) {
  try {

    if (!validatorsContractAddress) {
      throw("missing env variable VALIDATORS_CONTRACT_ADDRESS");
    }

    const validatorsInstance = await artifacts.require('IOrbsValidators').at(validatorsContractAddress);

    let validatorAddresses = await validatorsInstance.getValidators();

    console.log(JSON.stringify({
      Validators: validatorAddresses
    }, null, 2));

    done();
  } catch (e) {
    console.log(e);
    done(e);
  }
};
