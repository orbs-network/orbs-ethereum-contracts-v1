
const doSomthing = async () => {
  const Tet = artifacts.require('Tet.sol');
  let tet = await Tet.deployed();
  let userAddr = "0x44AA79091FAD956d12086C5Ee782DDf3A8124549";

  await tet.assign(userAddr, 200, {from: userAddr});
}

module.exports = function(callback) {
  doSomthing();
}
