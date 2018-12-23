module.exports = async function(done) {
  try {
    const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
    let asbInstance = await AutonomousSwapBridge.deployed();
    console.log(`${asbInstance.address} \n`)
    done();
  } catch(e) {
    console.log(e);
    done(e);
  }
}
