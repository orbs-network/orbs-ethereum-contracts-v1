module.exports = async function(done) {
  try {

    const subscriptionManager = artifacts.require('FakeSubscriptionChecker');
    let instance = await subscriptionManager.new();

    console.log(JSON.stringify({
      Address: instance.address
    }, null, 2));

    done();

  } catch (e) {
    console.log(e);
    done(e);
  }
};
