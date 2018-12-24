module.exports = async function(done) {
  try {
    const Tet = artifacts.require('Tet.sol');
    let tet = await Tet.deployed();
    if (process.argv.length != 6) {
      console.error("Wrong number of arguments expect (truffle exec assign.js orbsAddr tokens)\n");
      exit(-1);
    }
    let userAddr = process.argv[4];
    let amount = process.argv[5];

    await tet.assign(userAddr, amount, {from: userAddr});
    done();
  } catch (e) {
    console.log(e);
    done(e);
  }
}
