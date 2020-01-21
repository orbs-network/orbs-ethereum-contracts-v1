import BN from "bn.js";

import {
    committeeChangedEvents,
    delegatedEvents, stakedEvents,
    totalStakeChangedEvents,
    validatorRegisteredEvents,
    subscriptionChangedEvents,
    paymentEvents,
    rewardAssignedEvents,
    feeAddedToBucketEvents, unstakedEvents, topologyChangedEvents
} from "./event-parsing";
import {expectBNArrayEqual} from "./driver";

function compare(a: any, b: any) {
    if (BN.isBN(a) || BN.isBN(b)) {
        return new BN(a).eq(new BN(b));
    } else {
        if (Array.isArray(a) && BN.isBN(a[0]) || Array.isArray(b) && BN.isBN(b[0])) {
            expectBNArrayEqual(a, b);
            return true;
        }
        expect(a).to.deep.equal(b);
        return true;
    }
}

const containEvent = (eventParser) => function(_super) {
    return function (this: any, data) {
        data = data || {};

        const log = eventParser(this._obj).pop(); // TODO - currently only checks last event of the required type

        this.assert(log != null, "expected the event to exist", "expected no event to exist");

        for (const k in data) {
            this.assert(
                compare(data[k], log[k])
                , "expected #{this} to be #{exp} but got #{act}"
                , "expected #{this} to not be #{act}"
                , data[k]    // expected
                , log[k]   // actual
            );
        }
    }
};

module.exports = function (chai) {
    chai.Assertion.overwriteMethod('delegatedEvent', containEvent(delegatedEvents));
    chai.Assertion.overwriteMethod('validatorRegisteredEvent', containEvent(validatorRegisteredEvents));
    chai.Assertion.overwriteMethod('committeeChangedEvent', containEvent(committeeChangedEvents));
    chai.Assertion.overwriteMethod('totalStakeChangedEvent', containEvent(totalStakeChangedEvents));
    chai.Assertion.overwriteMethod('stakedEvent', containEvent(stakedEvents));
    chai.Assertion.overwriteMethod('unstakedEvent', containEvent(unstakedEvents));
    chai.Assertion.overwriteMethod('subscriptionChangedEvent', containEvent(subscriptionChangedEvents));
    chai.Assertion.overwriteMethod('paymentEvent', containEvent(paymentEvents));
    chai.Assertion.overwriteMethod('feeAddedToBucketEvent', containEvent(feeAddedToBucketEvents));
    chai.Assertion.overwriteMethod('rewardAssignedEvent', containEvent(rewardAssignedEvents));
    chai.Assertion.overwriteMethod('topologyChangedEvent', containEvent(topologyChangedEvents));

    chai.Assertion.overwriteMethod('haveCommittee', containEvent(function(o) { return [o]}));
};
