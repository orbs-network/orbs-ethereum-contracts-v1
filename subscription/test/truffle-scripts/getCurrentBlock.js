module.exports = async function(done) {
  try {

    let block = await web3.eth.getBlock("latest")

    console.log(JSON.stringify({
      CurrentBlock: block.number
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
