
// a sample test just to see we can use the driver, and compile the typescript

import {Driver} from "pos-v2";
const BN = require('bn.js');

const test = async () => {
    const d = await Driver.new();
    const monthlyRate = new BN(1000);
    const firstPayment = monthlyRate.mul(new BN(2));

    const subscriber = await d.newSubscriber("defaultTier", monthlyRate);

    // buy subscription for a new VC
    const appOwner = d.newParticipant();
    await d.erc20.assign(appOwner.address, firstPayment);
    await d.erc20.approve(subscriber.address, firstPayment, {
        from: appOwner.address
    });

    await subscriber.createVC(firstPayment, "main", {
        from: appOwner.address
    });

    await d.subscriptions.web3Contract.getPastEvents("SubscriptionChanged", {
        fromBlock: 0,
        toBlock: "latest"
    });

    process.exit(0);

};

test().catch(e => {
    console.log(e);
    process.exit(1);
});
