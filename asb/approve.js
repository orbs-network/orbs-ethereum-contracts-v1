
const doSomthing = async () => {
  const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
  let asbInstance = await AutonomousSwapBridge.deployed();
  const Tet = artifacts.require('Tet.sol');
  let tet = await Tet.deployed();
  let userAddr = "0x44AA79091FAD956d12086C5Ee782DDf3A8124549";
  
  await tet.approve(asbInstance.address, 55, {from: userAddr});
}

module.exports = function(callback) {
  doSomthing();
}
