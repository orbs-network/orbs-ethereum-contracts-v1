module.exports = async function(done) {
  try {

    const Tet = artifacts.require('Tet');
    let instance = await Tet.new();

    console.log(JSON.stringify({
      Address: instance.address
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
