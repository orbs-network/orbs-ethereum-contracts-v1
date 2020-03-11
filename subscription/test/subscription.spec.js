
const {expect, use} = require("chai");
const {Driver} = require("./driver");
const {orbsAssertions} = require("psilo");

use(orbsAssertions);

describe("orbs network", async () => {
    let driver;
    before(async () => {
        driver = await Driver.build();
    });

    after(() => {
        driver.stop();
    });

    it("rejects transactions after refreshing when subscription in not valid", async () => {

        const tx1Result = await driver.sendGenericOrbsTransaction();
        expect(tx1Result).to.be.successful;

        const subscriptionManager = await driver.deploySubscriptionManager();
        expect(subscriptionManager).to.have.property('address');

        await driver.waitForOrbsFinality();

        const setSubscriptionManagerResult = await driver.setSubscriptionManager(subscriptionManager.address);
        expect(setSubscriptionManagerResult).to.be.successful;

        const tx2Result = await driver.sendGenericOrbsTransaction();
        expect(tx2Result).to.be.rejected;
    })
});
