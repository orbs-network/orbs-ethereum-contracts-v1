
const doSomthing = async () => {
  const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
  let asbInstance = await AutonomousSwapBridge.deployed();
  const Tet = artifacts.require('Tet.sol');
  let tet = await Tet.deployed();
  if (process.argv.length != 7) {
    console.error("Wrong number of arguments expect (truffle exec transferOut.js userAddr orbsAddr amount\n");
    exit(-1);
  }
  let userAddr = process.argv[4];
  let orbsAddr = process.argv[5];
  let amount = process.argv[6];

  let response = await asbInstance.transferOut(orbsAddr, amount, {from: userAddr});
  console.log(`${response.tx}\n`)
}

module.exports = function(callback) {
  doSomthing();
}
