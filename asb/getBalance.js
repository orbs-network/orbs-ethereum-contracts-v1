
const doSomthing = async () => {
  const Tet = artifacts.require('Tet.sol');
  let tet = await Tet.deployed();
  let userAddr = "0x44AA79091FAD956d12086C5Ee782DDf3A8124549";

  let balance = await tet.balanceOf(userAddr, {from: userAddr})
  console.log(`${balance}\n`)
}

module.exports = function(callback) {
  doSomthing();
}
