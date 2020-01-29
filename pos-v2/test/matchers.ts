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
import * as _ from "lodash";

export function isBNArrayEqual(a1: Array<any>, a2: Array<any>): boolean {
    return a1.length == a2.length && a1.find((v, i) =>
        !(new BN(a1[i]).eq(new BN(a2[i])))
    ) == null;
}

function compare(a: any, b: any): boolean {
    if (BN.isBN(a) || BN.isBN(b)) {
        return new BN(a).eq(new BN(b));
    } else {
        if (Array.isArray(a) && BN.isBN(a[0]) || Array.isArray(b) && BN.isBN(b[0])) {
            return isBNArrayEqual(a, b);
        }
        return _.isEqual(a,b);
    }
}

const containEvent = (eventParser) => function(_super) {
    return function (this: any, data) {
        data = data || {};

        const logs = eventParser(this._obj);

        this.assert(logs.length != 0, "expected the event to exist", "expected no event to exist");

        if (logs.length == 1) {
            const log = logs.pop();
            for (const k in data) {
                this.assert(
                    compare(data[k], log[k])
                    , "expected #{this} to be #{exp} but got #{act}"
                    , "expected #{this} to not be #{act}"
                    , data[k]    // expected
                    , log[k]   // actual
                );
            }
        } else {
            for (const log of logs) {
                let foundDiff = false;
                for (const k in data) {
                    if (!compare(data[k], log[k])) {
                        foundDiff = true;
                        break;
                    }
                }
                if (!foundDiff) {
                    return;
                }
            }
            this.assert(false, `No event with properties ${JSON.stringify(data)} found. Events are ${JSON.stringify(logs)}`) // TODO make this log prettier
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
