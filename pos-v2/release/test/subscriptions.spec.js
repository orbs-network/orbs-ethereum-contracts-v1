"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
var bn_js_1 = __importDefault(require("bn.js"));
var driver_1 = require("./driver");
var chai_1 = __importDefault(require("chai"));
var event_parsing_1 = require("./event-parsing");
var eth_1 = require("../eth");
var helpers_1 = require("./helpers");
chai_1.default.use(require('chai-bn')(bn_js_1.default));
chai_1.default.use(require('./matchers'));
var expect = chai_1.default.expect;
describe('subscriptions-high-level-flows', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        it('registers and pays for a VC', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, monthlyRate, firstPayment, subscriber, appOwner, r, firstSubsc, blockNumber, blockTimestamp, _a, expectedGenRef, secondsInMonth, payedDurationInSeconds, expectedExpiration, vcid, anotherPayer, secondPayment, secondSubsc, extendedDurationInSeconds, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _g.sent();
                        monthlyRate = new bn_js_1.default(1000);
                        firstPayment = monthlyRate.mul(new bn_js_1.default(2));
                        return [4 /*yield*/, d.newSubscriber("defaultTier", monthlyRate)];
                    case 2:
                        subscriber = _g.sent();
                        appOwner = d.newParticipant();
                        return [4 /*yield*/, d.erc20.assign(appOwner.address, firstPayment)];
                    case 3:
                        _g.sent(); // TODO extract assign+approve to driver in two places
                        return [4 /*yield*/, d.erc20.approve(subscriber.address, firstPayment, { from: appOwner.address })];
                    case 4:
                        _g.sent();
                        return [4 /*yield*/, subscriber.createVC(firstPayment, "main", { from: appOwner.address })];
                    case 5:
                        r = _g.sent();
                        expect(r).to.have.subscriptionChangedEvent();
                        firstSubsc = event_parsing_1.subscriptionChangedEvents(r).pop();
                        blockNumber = new bn_js_1.default(r.blockNumber);
                        _a = bn_js_1.default.bind;
                        return [4 /*yield*/, eth_1.web3.eth.getBlock(blockNumber)];
                    case 6:
                        blockTimestamp = new (_a.apply(bn_js_1.default, [void 0, (_g.sent()).timestamp]))();
                        expectedGenRef = blockNumber.add(new bn_js_1.default('300'));
                        secondsInMonth = new bn_js_1.default(30 * 24 * 60 * 60);
                        payedDurationInSeconds = firstPayment.mul(secondsInMonth).div(monthlyRate);
                        expectedExpiration = new bn_js_1.default(blockTimestamp).add(payedDurationInSeconds);
                        expect(firstSubsc.vcid).to.exist;
                        expect(firstSubsc.genRef).to.be.bignumber.equal(expectedGenRef);
                        expect(firstSubsc.expiresAt).to.be.bignumber.equal(expectedExpiration);
                        expect(firstSubsc.tier).to.equal("defaultTier");
                        vcid = firstSubsc.vcid;
                        expect(r).to.have.paymentEvent({ vcid: vcid, by: appOwner.address, amount: firstPayment, tier: "defaultTier", rate: monthlyRate });
                        anotherPayer = d.newParticipant();
                        secondPayment = new bn_js_1.default(3000);
                        return [4 /*yield*/, d.erc20.assign(anotherPayer.address, secondPayment)];
                    case 7:
                        _g.sent();
                        return [4 /*yield*/, d.erc20.approve(subscriber.address, secondPayment, { from: anotherPayer.address })];
                    case 8:
                        _g.sent();
                        return [4 /*yield*/, subscriber.extendSubscription(vcid, secondPayment, { from: anotherPayer.address })];
                    case 9:
                        r = _g.sent();
                        expect(r).to.have.paymentEvent({ vcid: vcid, by: anotherPayer.address, amount: secondPayment, tier: "defaultTier", rate: monthlyRate });
                        expect(r).to.have.subscriptionChangedEvent();
                        secondSubsc = event_parsing_1.subscriptionChangedEvents(r).pop();
                        extendedDurationInSeconds = secondPayment.mul(secondsInMonth).div(monthlyRate);
                        expectedExpiration = new bn_js_1.default(firstSubsc.expiresAt).add(extendedDurationInSeconds);
                        expect(secondSubsc.vcid).to.equal(firstSubsc.vcid);
                        expect(secondSubsc.genRef).to.be.equal(firstSubsc.genRef);
                        expect(secondSubsc.expiresAt).to.be.bignumber.equal(expectedExpiration);
                        expect(secondSubsc.tier).to.equal("defaultTier");
                        _b = expect;
                        return [4 /*yield*/, d.erc20.balanceOf(appOwner.address)];
                    case 10:
                        _b.apply(void 0, [_g.sent()]).is.bignumber.equal('0');
                        _c = expect;
                        return [4 /*yield*/, d.erc20.balanceOf(anotherPayer.address)];
                    case 11:
                        _c.apply(void 0, [_g.sent()]).is.bignumber.equal('0');
                        _d = expect;
                        return [4 /*yield*/, d.erc20.balanceOf(subscriber.address)];
                    case 12:
                        _d.apply(void 0, [_g.sent()]).is.bignumber.equal('0');
                        _e = expect;
                        return [4 /*yield*/, d.erc20.balanceOf(d.subscriptions.address)];
                    case 13:
                        _e.apply(void 0, [_g.sent()]).is.bignumber.equal('0');
                        _f = expect;
                        return [4 /*yield*/, d.erc20.balanceOf(d.rewards.address)];
                    case 14:
                        _f.apply(void 0, [_g.sent()]).is.bignumber.equal(firstPayment.add(secondPayment));
                        return [2 /*return*/];
                }
            });
        }); });
        it('registers subsciber only by owner', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, subscriber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, d.newSubscriber('tier', 1)];
                    case 2:
                        subscriber = _a.sent();
                        return [4 /*yield*/, driver_1.expectRejected(d.subscriptions.addSubscriber(subscriber.address, { from: d.contractsNonOwner }), "Non-owner should not be able to add a subscriber")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, d.subscriptions.addSubscriber(subscriber.address, { from: d.contractsOwner })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not add a subscriber with a zero address', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, driver_1.expectRejected(d.subscriptions.addSubscriber(driver_1.ZERO_ADDR, { from: d.contractsOwner }), "Should not deploy a subscriber with a zero address")];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('is able to create multiple VCs from the same subscriber', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, subs, owner, amount, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, d.newSubscriber("tier", 1)];
                    case 2:
                        subs = _a.sent();
                        owner = d.newParticipant();
                        amount = 10;
                        return [4 /*yield*/, owner.assignAndApproveOrbs(amount, subs.address)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, subs.createVC(amount, "main", { from: owner.address })];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.subscriptionChangedEvent();
                        return [4 /*yield*/, owner.assignAndApproveOrbs(amount, subs.address)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, subs.createVC(amount, "main", { from: owner.address })];
                    case 6:
                        r = _a.sent();
                        expect(r).to.have.a.subscriptionChangedEvent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('sets, overrides, gets and clears a vc config field by and only by the vc owner', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, subs, owner, amount, r, vcid, key, value, nonOwner, v, value2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, d.newSubscriber("tier", 1)];
                    case 2:
                        subs = _a.sent();
                        owner = d.newParticipant();
                        amount = 10;
                        return [4 /*yield*/, owner.assignAndApproveOrbs(amount, subs.address)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, subs.createVC(amount, "main", { from: owner.address })];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.subscriptionChangedEvent();
                        vcid = new bn_js_1.default(event_parsing_1.subscriptionChangedEvents(r)[0].vcid);
                        key = 'key_' + Date.now().toString();
                        value = 'value_' + Date.now().toString();
                        return [4 /*yield*/, d.subscriptions.setVcConfigRecord(vcid, key, value, { from: owner.address })];
                    case 5:
                        r = _a.sent();
                        expect(r).to.have.a.vcConfigRecordChangedEvent({
                            vcid: vcid,
                            key: key,
                            value: value
                        });
                        nonOwner = d.newParticipant();
                        return [4 /*yield*/, d.subscriptions.getVcConfigRecord(vcid, key, { from: nonOwner.address })];
                    case 6:
                        v = _a.sent();
                        expect(v).to.equal(value);
                        value2 = 'value2_' + Date.now().toString();
                        return [4 /*yield*/, d.subscriptions.setVcConfigRecord(vcid, key, value2, { from: owner.address })];
                    case 7:
                        r = _a.sent();
                        expect(r).to.have.a.vcConfigRecordChangedEvent({
                            vcid: vcid,
                            key: key,
                            value: value2
                        });
                        return [4 /*yield*/, d.subscriptions.getVcConfigRecord(vcid, key, { from: nonOwner.address })];
                    case 8:
                        // get again
                        v = _a.sent();
                        expect(v).to.equal(value2);
                        return [4 /*yield*/, d.subscriptions.setVcConfigRecord(vcid, key, "", { from: owner.address })];
                    case 9:
                        // clear
                        r = _a.sent();
                        expect(r).to.have.a.vcConfigRecordChangedEvent({
                            vcid: vcid,
                            key: key,
                            value: ""
                        });
                        return [4 /*yield*/, d.subscriptions.getVcConfigRecord(vcid, key, { from: nonOwner.address })];
                    case 10:
                        // get again
                        v = _a.sent();
                        expect(v).to.equal("");
                        // reject if set by non owner
                        return [4 /*yield*/, driver_1.expectRejected(d.subscriptions.setVcConfigRecord(vcid, key, value, { from: nonOwner.address }))];
                    case 11:
                        // reject if set by non owner
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('allows VC owner to transfer ownership', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, subs, owner, amount, r, vcid, newOwner, nonOwner;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, d.newSubscriber("tier", 1)];
                    case 2:
                        subs = _a.sent();
                        owner = d.newParticipant();
                        amount = 10;
                        return [4 /*yield*/, owner.assignAndApproveOrbs(amount, subs.address)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, subs.createVC(amount, "main", { from: owner.address })];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.subscriptionChangedEvent();
                        vcid = helpers_1.bn(event_parsing_1.subscriptionChangedEvents(r)[0].vcid);
                        expect(r).to.have.a.vcCreatedEvent({
                            vcid: vcid,
                            owner: owner.address
                        });
                        newOwner = d.newParticipant();
                        nonOwner = d.newParticipant();
                        return [4 /*yield*/, driver_1.expectRejected(d.subscriptions.setVcOwner(vcid, newOwner.address, { from: nonOwner.address }))];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, d.subscriptions.setVcOwner(vcid, newOwner.address, { from: owner.address })];
                    case 6:
                        r = _a.sent();
                        expect(r).to.have.a.vcOwnerChangedEvent({
                            vcid: vcid,
                            previousOwner: owner.address,
                            newOwner: newOwner.address
                        });
                        return [4 /*yield*/, driver_1.expectRejected(d.subscriptions.setVcOwner(vcid, owner.address, { from: owner.address }))];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, d.subscriptions.setVcOwner(vcid, owner.address, { from: newOwner.address })];
                    case 8:
                        r = _a.sent();
                        expect(r).to.have.a.vcOwnerChangedEvent({
                            vcid: vcid,
                            previousOwner: newOwner.address,
                            newOwner: owner.address
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
