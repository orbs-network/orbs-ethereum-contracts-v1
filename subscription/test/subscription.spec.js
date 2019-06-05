const {expect} = require("chai");
const {Driver} = require("./driver");

describe("orbs network", async () => {
    let driver;
    before(async ()=>{
        driver = await Driver.build();
    });

    after(()=>{
        driver.stop();
    });

    it("rejects transactions after refreshing when subscription in not valid", async () => {

        const tx1Result = await driver.sendGenericOrbsTransaction();

        expect(tx1Result.executionResult).to.equal("SUCCESS");

        const subscriptionManager = await driver.deploySubscriptionManager();
        expect(subscriptionManager).to.have.property('address');

        await driver.waitForOrbsFinality();

        const setSubscriptionManagerResult = await driver.setSubscriptionManager(subscriptionManager.address);
        expect(setSubscriptionManagerResult.executionResult).to.equal("SUCCESS");

        const tx2Result = await driver.sendGenericOrbsTransaction();
        expect(tx2Result.executionResult).to.equal("NOT_EXECUTED");
    })
});