
const doSomthing = async () => {
  const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
  let asbInstance = await AutonomousSwapBridge.deployed();
  const Tet = artifacts.require('Tet.sol');
  let tet = await Tet.deployed();
  let userAddr = "0x44AA79091FAD956d12086C5Ee782DDf3A8124549";

  let orbsAddr = "0x3fced656aCBd6700cE7d546f6EFDCDd482D8142a"; // temp
  let response = await asbInstance.transferOut(orbsAddr, 55, {from: userAddr});
  console.log(`${response.tx}\n`)
}

module.exports = function(callback) {
  doSomthing();
}
