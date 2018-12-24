module.exports = async function(done) {
  try {
    const AutonomousSwapBridge = artifacts.require('AutonomousSwapBridge.sol');
    let asbInstance = await AutonomousSwapBridge.deployed();
    const Tet = artifacts.require('Tet.sol');
    let tet = await Tet.deployed();
    if (process.argv.length != 6) {
      console.error("Wrong number of arguments expect (truffle exec approve.js userAddr tokens)\n");
      exit(-1);
    }
    let userAddr = process.argv[4];
    let amount = process.argv[5];

    await tet.approve(asbInstance.address, amount, {from: userAddr});
    done();
  } catch (e) {
    console.log(e);
    done(e);
  }
}
