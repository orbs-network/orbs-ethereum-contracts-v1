
const doSomthing = async () => {
  const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
  let asbInstance = await AutonomousSwapBridge.deployed();
  console.log(`${asbInstance.address} \n`)
}

module.exports = function(callback) {
  doSomthing();
}
