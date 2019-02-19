module.exports = async function(done) {
  try {

    const voting = artifacts.require('Voting');
    let instance = await voting.new();

    console.log(JSON.stringify({
      Address: instance.address
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
