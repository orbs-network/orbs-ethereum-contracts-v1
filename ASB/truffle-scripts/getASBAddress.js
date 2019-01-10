module.exports = async function(done) {
  try {

    const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
    let instance = await AutonomousSwapBridge.deployed();

    console.log(JSON.stringify({
      Address: instance.address
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};