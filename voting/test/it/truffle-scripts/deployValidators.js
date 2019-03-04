module.exports = async function(done) {
  try {

    const validators = artifacts.require('OrbsValidators');
    let instance = await validators.new(20);

    console.log(JSON.stringify({
      Address: instance.address
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
