module.exports = async function(done) {
  try {

    const ercToken = artifacts.require('TestingERC20');
    let instance = await ercToken.new();

    console.log(JSON.stringify({
      Address: instance.address
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
