module.exports = async function(done) {
  try {

    const validators = artifacts.require('Federation');
    let instance = await validators.new();

    console.log(JSON.stringify({
      Address: instance.address
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
