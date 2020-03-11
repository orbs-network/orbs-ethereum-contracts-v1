"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var bn_js_1 = __importDefault(require("bn.js"));
var event_parsing_1 = require("./event-parsing");
var _ = __importStar(require("lodash"));
function isBNArrayEqual(a1, a2) {
    return (a1.length == a2.length &&
        a1.find(function (v, i) { return !new bn_js_1.default(a1[i]).eq(new bn_js_1.default(a2[i])); }) == null);
}
exports.isBNArrayEqual = isBNArrayEqual;
function compare(a, b) {
    if (bn_js_1.default.isBN(a) || bn_js_1.default.isBN(b)) {
        return new bn_js_1.default(a).eq(new bn_js_1.default(b));
    }
    else {
        if ((Array.isArray(a) && bn_js_1.default.isBN(a[0])) ||
            (Array.isArray(b) && bn_js_1.default.isBN(b[0]))) {
            return isBNArrayEqual(a, b);
        }
        return _.isEqual(a, b);
    }
}
var containEvent = function (eventParser) {
    return function (_super) {
        return function (data) {
            data = data || {};
            var logs = eventParser(this._obj);
            this.assert(logs.length != 0, "expected the event to exist", "expected no event to exist");
            if (logs.length == 1) {
                var log = logs.pop();
                for (var k in data) {
                    this.assert(compare(data[k], log[k]), "expected #{this} to be #{exp} but got #{act}", "expected #{this} to not be #{act}", data[k], // expected
                    log[k] // actual
                    );
                }
            }
            else {
                for (var _i = 0, logs_1 = logs; _i < logs_1.length; _i++) {
                    var log = logs_1[_i];
                    var foundDiff = false;
                    for (var k in data) {
                        if (!compare(data[k], log[k])) {
                            foundDiff = true;
                            break;
                        }
                    }
                    if (!foundDiff) {
                        return;
                    }
                }
                this.assert(false, "No event with properties " + JSON.stringify(data) + " found. Events are " + JSON.stringify(logs)); // TODO make this log prettier
            }
        };
    };
};
module.exports = function (chai) {
    chai.Assertion.overwriteMethod("delegatedEvent", containEvent(event_parsing_1.delegatedEvents));
    chai.Assertion.overwriteMethod("validatorRegisteredEvent", containEvent(event_parsing_1.validatorRegisteredEvents));
    chai.Assertion.overwriteMethod("committeeChangedEvent", containEvent(event_parsing_1.committeeChangedEvents));
    chai.Assertion.overwriteMethod("stakeChangedEvent", containEvent(event_parsing_1.stakeChangedEvents));
    chai.Assertion.overwriteMethod("stakedEvent", containEvent(event_parsing_1.stakedEvents));
    chai.Assertion.overwriteMethod("unstakedEvent", containEvent(event_parsing_1.unstakedEvents));
    chai.Assertion.overwriteMethod("subscriptionChangedEvent", containEvent(event_parsing_1.subscriptionChangedEvents));
    chai.Assertion.overwriteMethod("paymentEvent", containEvent(event_parsing_1.paymentEvents));
    chai.Assertion.overwriteMethod("feeAddedToBucketEvent", containEvent(event_parsing_1.feeAddedToBucketEvents));
    chai.Assertion.overwriteMethod("rewardAssignedEvent", containEvent(event_parsing_1.rewardAssignedEvents));
    chai.Assertion.overwriteMethod("topologyChangedEvent", containEvent(event_parsing_1.topologyChangedEvents));
    chai.Assertion.overwriteMethod("voteOutEvent", containEvent(event_parsing_1.voteOutEvents));
    chai.Assertion.overwriteMethod("votedOutOfCommitteeEvent", containEvent(event_parsing_1.votedOutOfCommitteeEvents));
    chai.Assertion.overwriteMethod("banningVoteEvent", containEvent(event_parsing_1.banningVoteEvents));
    chai.Assertion.overwriteMethod("bannedEvent", containEvent(event_parsing_1.electionsBanned));
    chai.Assertion.overwriteMethod("unbannedEvent", containEvent(event_parsing_1.electionsUnbanned));
    chai.Assertion.overwriteMethod("vcConfigRecordChangedEvent", containEvent(event_parsing_1.vcConfigRecordChangedEvents));
    chai.Assertion.overwriteMethod("vcOwnerChangedEvent", containEvent(event_parsing_1.vcOwnerChangedEvents));
    chai.Assertion.overwriteMethod("vcCreatedEvent", containEvent(event_parsing_1.vcCreatedEvents));
    chai.Assertion.overwriteMethod("contractAddressUpdatedEvent", containEvent(event_parsing_1.contractAddressUpdatedEvents));
    chai.Assertion.overwriteMethod("protocolChangedEvent", containEvent(event_parsing_1.protocolChangedEvents));
    chai.Assertion.overwriteMethod("haveCommittee", containEvent(function (o) { return [o]; }));
};
