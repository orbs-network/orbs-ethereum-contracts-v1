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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
var _ = __importStar(require("lodash"));
var bn_js_1 = __importDefault(require("bn.js"));
var driver_1 = require("./driver");
var chai_1 = __importDefault(require("chai"));
chai_1.default.use(require('chai-bn')(bn_js_1.default));
chai_1.default.use(require('./matchers'));
var expect = chai_1.default.expect;
var assert = chai_1.default.assert;
var committee_provider_1 = require("./committee-provider");
var helpers_1 = require("./helpers");
var eth_1 = require("../eth");
describe('elections-high-level-flows', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        it('handle delegation requests', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, d1, d2, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, d.newParticipant()];
                    case 2:
                        d1 = _a.sent();
                        return [4 /*yield*/, d.newParticipant()];
                    case 3:
                        d2 = _a.sent();
                        return [4 /*yield*/, d1.delegate(d2)];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.delegatedEvent({
                            from: d1.address,
                            to: d2.address
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('sorts committee by stake', function () { return __awaiter(void 0, void 0, void 0, function () {
            var stake100, stake200, stake300, stake500, stake1000, d, committeeProvider, validatorStaked100, r, committeeFromAdapter, validatorStaked200, validatorStaked300, inTopologyValidator, outOfTopologyValidator, validator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stake100 = new bn_js_1.default(100);
                        stake200 = new bn_js_1.default(200);
                        stake300 = new bn_js_1.default(300);
                        stake500 = new bn_js_1.default(500);
                        stake1000 = new bn_js_1.default(1000);
                        return [4 /*yield*/, driver_1.Driver.new(2, 4, stake100)];
                    case 1:
                        d = _a.sent();
                        committeeProvider = new committee_provider_1.CommitteeProvider(eth_1.ETHEREUM_URL, d.elections.address);
                        validatorStaked100 = d.newParticipant();
                        return [4 /*yield*/, validatorStaked100.stake(stake100)];
                    case 2:
                        r = _a.sent();
                        expect(r).to.have.a.stakedEvent();
                        return [4 /*yield*/, validatorStaked100.registerAsValidator()];
                    case 3:
                        r = _a.sent();
                        expect(r).to.have.a.validatorRegisteredEvent({
                            addr: validatorStaked100.address,
                            ip: validatorStaked100.ip
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: [validatorStaked100.orbsAddress],
                            ips: [validatorStaked100.ip]
                        });
                        expect(r).to.not.have.a.committeeChangedEvent();
                        return [4 /*yield*/, validatorStaked100.notifyReadyForCommittee()];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [validatorStaked100.address],
                            orbsAddrs: [validatorStaked100.orbsAddress],
                            stakes: [stake100],
                        });
                        return [4 /*yield*/, committeeProvider.getCommitteeAsOf(r.blockNumber)];
                    case 5:
                        committeeFromAdapter = _a.sent();
                        expect(committeeFromAdapter).to.haveCommittee({
                            addrs: [validatorStaked100.address.toLowerCase()],
                            orbsAddrs: [validatorStaked100.orbsAddress.toLowerCase()],
                            stakes: [stake100],
                        });
                        validatorStaked200 = d.newParticipant();
                        return [4 /*yield*/, validatorStaked200.stake(stake200)];
                    case 6:
                        r = _a.sent();
                        expect(r).to.have.a.stakeChangedEvent({ addr: validatorStaked200.address, committeeStake: stake200 });
                        return [4 /*yield*/, validatorStaked200.registerAsValidator()];
                    case 7:
                        r = _a.sent();
                        expect(r).to.have.a.validatorRegisteredEvent({
                            addr: validatorStaked200.address,
                            ip: validatorStaked200.ip,
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: [validatorStaked100.orbsAddress, validatorStaked200.orbsAddress],
                            ips: [validatorStaked100.ip, validatorStaked200.ip]
                        });
                        expect(r).to.not.have.a.committeeChangedEvent();
                        return [4 /*yield*/, validatorStaked200.notifyReadyForCommittee()];
                    case 8:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [validatorStaked200.address, validatorStaked100.address],
                            orbsAddrs: [validatorStaked200.orbsAddress, validatorStaked100.orbsAddress],
                            stakes: [stake200, stake100]
                        });
                        validatorStaked300 = d.newParticipant();
                        return [4 /*yield*/, validatorStaked300.stake(stake300)];
                    case 9:
                        r = _a.sent();
                        expect(r).to.have.a.stakedEvent();
                        return [4 /*yield*/, validatorStaked300.registerAsValidator()];
                    case 10:
                        r = _a.sent();
                        expect(r).to.have.a.validatorRegisteredEvent({
                            addr: validatorStaked300.address,
                            ip: validatorStaked300.ip
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: [validatorStaked200.orbsAddress, validatorStaked100.orbsAddress, validatorStaked300.orbsAddress],
                            ips: [validatorStaked200.ip, validatorStaked100.ip, validatorStaked300.ip]
                        });
                        expect(r).to.not.have.a.committeeChangedEvent();
                        return [4 /*yield*/, validatorStaked300.notifyReadyForCommittee()];
                    case 11:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [validatorStaked300.address, validatorStaked200.address],
                            orbsAddrs: [validatorStaked300.orbsAddress, validatorStaked200.orbsAddress],
                            stakes: [stake300, stake200]
                        });
                        return [4 /*yield*/, d.delegateMoreStake(stake300, validatorStaked200)];
                    case 12:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [validatorStaked200.address, validatorStaked300.address],
                            orbsAddrs: [validatorStaked200.orbsAddress, validatorStaked300.orbsAddress],
                            stakes: [stake200.add(stake300), stake300]
                        });
                        expect(r).to.not.have.a.topologyChangedEvent();
                        return [4 /*yield*/, d.delegateMoreStake(stake500, validatorStaked100)];
                    case 13:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [validatorStaked100.address, validatorStaked200.address],
                            orbsAddrs: [validatorStaked100.orbsAddress, validatorStaked200.orbsAddress],
                            stakes: [stake100.add(stake500), stake500]
                        });
                        expect(r).to.not.have.a.topologyChangedEvent();
                        inTopologyValidator = d.newParticipant();
                        return [4 /*yield*/, inTopologyValidator.stake(stake100)];
                    case 14:
                        r = _a.sent();
                        expect(r).to.have.a.stakedEvent();
                        return [4 /*yield*/, inTopologyValidator.registerAsValidator()];
                    case 15:
                        r = _a.sent();
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: [validatorStaked100.orbsAddress, validatorStaked200.orbsAddress, validatorStaked300.orbsAddress, inTopologyValidator.orbsAddress],
                            ips: [validatorStaked100.ip, validatorStaked200.ip, validatorStaked300.ip, inTopologyValidator.ip],
                        });
                        expect(r).to.not.have.a.committeeChangedEvent();
                        return [4 /*yield*/, inTopologyValidator.notifyReadyForCommittee()];
                    case 16:
                        r = _a.sent();
                        expect(r).to.not.have.a.committeeChangedEvent();
                        return [4 /*yield*/, d.delegateMoreStake(201, inTopologyValidator)];
                    case 17:
                        // The bottom validator in the topology delegates more stake and switches places with the second to last
                        // This does not change the committee nor the topology, so no event should be emitted
                        r = _a.sent();
                        expect(r).to.not.have.a.committeeChangedEvent();
                        expect(r).to.not.have.a.topologyChangedEvent();
                        return [4 /*yield*/, d.elections.getTopology()];
                    case 18:
                        // make sure the order of validators really did change
                        r = _a.sent();
                        expect(r).to.eql([validatorStaked100.address, validatorStaked200.address, inTopologyValidator.address, validatorStaked300.address]);
                        outOfTopologyValidator = d.newParticipant();
                        return [4 /*yield*/, outOfTopologyValidator.stake(stake100)];
                    case 19:
                        r = _a.sent();
                        expect(r).to.have.a.stakedEvent();
                        return [4 /*yield*/, outOfTopologyValidator.registerAsValidator()];
                    case 20:
                        r = _a.sent();
                        expect(r).to.not.have.a.topologyChangedEvent();
                        return [4 /*yield*/, outOfTopologyValidator.notifyReadyForCommittee()];
                    case 21:
                        r = _a.sent();
                        expect(r).to.not.have.a.committeeChangedEvent();
                        validator = d.newParticipant();
                        return [4 /*yield*/, validator.registerAsValidator()];
                    case 22:
                        _a.sent();
                        return [4 /*yield*/, validator.notifyReadyForCommittee()];
                    case 23:
                        _a.sent();
                        return [4 /*yield*/, validator.stake(stake1000)];
                    case 24:
                        r = _a.sent(); // now top of committee
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [validator.address, validatorStaked100.address],
                            orbsAddrs: [validator.orbsAddress, validatorStaked100.orbsAddress],
                            stakes: [stake1000, stake100.add(stake500)]
                        });
                        return [4 /*yield*/, validator.unstake(501)];
                    case 25:
                        r = _a.sent(); // now out of committee but still in topology
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [validatorStaked100.address, validatorStaked200.address],
                            orbsAddrs: [validatorStaked100.orbsAddress, validatorStaked200.orbsAddress],
                            stakes: [stake100.add(stake500), stake500]
                        });
                        expect(r).to.not.have.a.topologyChangedEvent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('votes out a committee member', function () { return __awaiter(void 0, void 0, void 0, function () {
            var stakesPercentage, committeeSize, thresholdCrossingIndex, d, r, committee, _i, stakesPercentage_1, p, v, _loop_1, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert(driver_1.DEFAULT_VOTE_OUT_THRESHOLD < 98); // so each committee member will hold a positive stake
                        assert(Math.floor(driver_1.DEFAULT_VOTE_OUT_THRESHOLD / 2) >= 98 - driver_1.DEFAULT_VOTE_OUT_THRESHOLD); // so the committee list will be ordered by stake
                        stakesPercentage = [
                            Math.ceil(driver_1.DEFAULT_VOTE_OUT_THRESHOLD / 2),
                            Math.floor(driver_1.DEFAULT_VOTE_OUT_THRESHOLD / 2),
                            98 - driver_1.DEFAULT_VOTE_OUT_THRESHOLD,
                            1,
                            1
                        ];
                        committeeSize = stakesPercentage.length;
                        thresholdCrossingIndex = 1;
                        return [4 /*yield*/, driver_1.Driver.new(committeeSize, committeeSize + 1)];
                    case 1:
                        d = _a.sent();
                        committee = [];
                        _i = 0, stakesPercentage_1 = stakesPercentage;
                        _a.label = 2;
                    case 2:
                        if (!(_i < stakesPercentage_1.length)) return [3 /*break*/, 7];
                        p = stakesPercentage_1[_i];
                        v = d.newParticipant();
                        return [4 /*yield*/, v.registerAsValidator()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, v.notifyReadyForCommittee()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, v.stake(driver_1.DEFAULT_MINIMUM_STAKE * p)];
                    case 5:
                        r = _a.sent();
                        committee.push(v);
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        expect(r).to.have.a.committeeChangedEvent({
                            orbsAddrs: committee.map(function (v) { return v.orbsAddress; })
                        });
                        _loop_1 = function (i) {
                            var votedOutValidator, _i, _a, v, r_1;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        votedOutValidator = committee[committeeSize - 1];
                                        _i = 0, _a = committee.slice(0, thresholdCrossingIndex);
                                        _b.label = 1;
                                    case 1:
                                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                                        v = _a[_i];
                                        return [4 /*yield*/, d.elections.voteOut(votedOutValidator.address, { from: v.orbsAddress })];
                                    case 2:
                                        r_1 = _b.sent();
                                        expect(r_1).to.have.a.voteOutEvent({
                                            voter: v.address,
                                            against: votedOutValidator.address
                                        });
                                        expect(r_1).to.not.have.a.votedOutOfCommitteeEvent();
                                        expect(r_1).to.not.have.a.committeeChangedEvent();
                                        _b.label = 3;
                                    case 3:
                                        _i++;
                                        return [3 /*break*/, 1];
                                    case 4: return [4 /*yield*/, d.elections.voteOut(votedOutValidator.address, { from: committee[thresholdCrossingIndex].orbsAddress })];
                                    case 5:
                                        r = _b.sent(); // Threshold is reached
                                        expect(r).to.have.a.voteOutEvent({
                                            voter: committee[thresholdCrossingIndex].address,
                                            against: votedOutValidator.address
                                        });
                                        expect(r).to.have.a.votedOutOfCommitteeEvent({
                                            addr: votedOutValidator.address
                                        });
                                        expect(r).to.have.a.committeeChangedEvent({
                                            addrs: committee.filter(function (v) { return v != votedOutValidator; }).map(function (v) { return v.address; })
                                        });
                                        expect(r).to.not.have.a.topologyChangedEvent(); // should remain in topology
                                        return [4 /*yield*/, votedOutValidator.notifyReadyForCommittee()];
                                    case 6:
                                        // voted-out validator re-joins by notifying ready-for-committee
                                        r = _b.sent();
                                        expect(r).to.have.a.committeeChangedEvent({
                                            addrs: committee.map(function (v) { return v.address; })
                                        });
                                        expect(r).to.not.have.a.topologyChangedEvent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        i = 0;
                        _a.label = 8;
                    case 8:
                        if (!(i < 2)) return [3 /*break*/, 11];
                        return [5 /*yield**/, _loop_1(i)];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10:
                        i++;
                        return [3 /*break*/, 8];
                    case 11: return [2 /*return*/];
                }
            });
        }); });
        it('discards stale votes', function () { return __awaiter(void 0, void 0, void 0, function () {
            var committeeSize, d, r, committee, i, v;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        assert(driver_1.DEFAULT_VOTE_OUT_THRESHOLD > 50); // so one out of two equal committee members does not cross the threshold
                        committeeSize = 2;
                        return [4 /*yield*/, driver_1.Driver.new(committeeSize, committeeSize + 1)];
                    case 1:
                        d = _a.sent();
                        committee = [];
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < committeeSize)) return [3 /*break*/, 7];
                        v = d.newParticipant();
                        return [4 /*yield*/, v.registerAsValidator()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, v.notifyReadyForCommittee()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, v.stake(driver_1.DEFAULT_MINIMUM_STAKE)];
                    case 5:
                        r = _a.sent();
                        committee.push(v);
                        _a.label = 6;
                    case 6:
                        i++;
                        return [3 /*break*/, 2];
                    case 7:
                        expect(r).to.have.a.committeeChangedEvent({
                            orbsAddrs: committee.map(function (v) { return v.orbsAddress; })
                        });
                        return [4 /*yield*/, d.elections.voteOut(committee[1].address, { from: committee[0].orbsAddress })];
                    case 8:
                        r = _a.sent();
                        expect(r).to.have.a.voteOutEvent({
                            voter: committee[0].address,
                            against: committee[1].address,
                        });
                        // ...*.* TiMe wArP *.*.....
                        return [4 /*yield*/, helpers_1.evmIncreaseTime(driver_1.DEFAULT_VOTE_OUT_TIMEOUT)];
                    case 9:
                        // ...*.* TiMe wArP *.*.....
                        _a.sent();
                        return [4 /*yield*/, d.elections.voteOut(committee[1].address, { from: committee[1].orbsAddress })];
                    case 10:
                        r = _a.sent(); // this should have crossed the vote-out threshold, but the previous vote had timed out
                        expect(r).to.have.a.voteOutEvent({
                            voter: committee[1].address,
                            against: committee[1].address,
                        });
                        expect(r).to.not.have.a.votedOutOfCommitteeEvent();
                        expect(r).to.not.have.a.committeeChangedEvent();
                        return [4 /*yield*/, d.elections.voteOut(committee[1].address, { from: committee[0].orbsAddress })];
                    case 11:
                        // recast the stale vote-out, threshold should be reached
                        r = _a.sent();
                        expect(r).to.have.a.voteOutEvent({
                            voter: committee[0].address,
                            against: committee[1].address,
                        });
                        expect(r).to.have.a.votedOutOfCommitteeEvent({
                            addr: committee[1].address
                        });
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [committee[0].address]
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should remove a validator with insufficient stake from committee', function () { return __awaiter(void 0, void 0, void 0, function () {
            var MIN_STAKE, d, v, r, unstakeAmount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        MIN_STAKE = new bn_js_1.default(100);
                        return [4 /*yield*/, driver_1.Driver.new(10, 15, MIN_STAKE)];
                    case 1:
                        d = _a.sent();
                        v = d.newParticipant();
                        return [4 /*yield*/, v.stake(MIN_STAKE)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, v.registerAsValidator()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, v.notifyReadyForCommittee()];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [v.address],
                            stakes: [MIN_STAKE]
                        });
                        unstakeAmount = MIN_STAKE.div(new bn_js_1.default(4));
                        return [4 /*yield*/, v.unstake(unstakeAmount)];
                    case 5:
                        r = _a.sent();
                        expect(r).to.have.a.unstakedEvent({
                            stakeOwner: v.address,
                            amount: unstakeAmount,
                            totalStakedAmount: MIN_STAKE.sub(unstakeAmount)
                        });
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [],
                            stakes: []
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('does not elect without registration', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, V1_STAKE, v, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        V1_STAKE = 100;
                        v = d.newParticipant();
                        return [4 /*yield*/, v.stake(V1_STAKE)];
                    case 2:
                        r = _a.sent();
                        expect(r).to.not.have.a.committeeChangedEvent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('a validator should not be able to register twice', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, v, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        v = d.newParticipant();
                        return [4 /*yield*/, v.stake(100)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, d.elections.registerValidator(v.ip, v.orbsAddress, { from: v.address })];
                    case 3:
                        r = _a.sent();
                        expect(r).to.have.a.validatorRegisteredEvent({
                            addr: v.address,
                            ip: v.ip
                        });
                        // The first validator attempts to register again - should not emit events
                        return [4 /*yield*/, driver_1.expectRejected(d.elections.registerValidator(v.ip, v.orbsAddress, { from: v.address }))];
                    case 4:
                        // The first validator attempts to register again - should not emit events
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should only accept stake notifications from the staking contract', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, stakingAddr, nonStakingAddr;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        stakingAddr = d.accounts[1];
                        nonStakingAddr = d.accounts[2];
                        return [4 /*yield*/, d.contractRegistry.set("staking", stakingAddr)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, driver_1.expectRejected(d.elections.stakeChange(d.accounts[0], 1, true, 1, { from: nonStakingAddr }), "should not accept notifications from an address other than the staking contract")];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, d.elections.stakeChange(d.accounts[0], 1, true, 1, { from: stakingAddr })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('staking before or after delegating has the same effect', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, firstValidator, r, delegator, delegator1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        firstValidator = d.newParticipant();
                        return [4 /*yield*/, firstValidator.stake(100)];
                    case 2:
                        r = _a.sent();
                        delegator = d.newParticipant();
                        return [4 /*yield*/, delegator.stake(100)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, delegator.delegate(firstValidator)];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.stakeChangedEvent({ addr: firstValidator.address, committeeStake: new bn_js_1.default(200) });
                        delegator1 = d.newParticipant();
                        return [4 /*yield*/, delegator1.delegate(firstValidator)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, delegator1.stake(100)];
                    case 6:
                        r = _a.sent();
                        expect(r).to.have.a.stakeChangedEvent({ addr: firstValidator.address, committeeStake: new bn_js_1.default(300) });
                        return [2 /*return*/];
                }
            });
        }); });
        it('does not count delegated stake twice', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, v1, v2, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        v1 = d.newParticipant();
                        v2 = d.newParticipant();
                        return [4 /*yield*/, v1.stake(100)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, v2.stake(100)];
                    case 3:
                        _a.sent(); // required due to the delegation cap ratio
                        return [4 /*yield*/, v1.delegate(v2)];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.stakeChangedEvent({
                            addr: v1.address,
                            committeeStake: new bn_js_1.default(0)
                        });
                        expect(r).to.have.a.stakeChangedEvent({
                            addr: v2.address,
                            committeeStake: new bn_js_1.default(200)
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('enforces effective stake limit of x-times the own stake', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, v1, v2, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new(2, 3, 100, 10)];
                    case 1:
                        d = _a.sent();
                        v1 = d.newParticipant();
                        v2 = d.newParticipant();
                        return [4 /*yield*/, v1.registerAsValidator()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, v1.notifyReadyForCommittee()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, v2.delegate(v1)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, v1.stake(100)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, v2.stake(900)];
                    case 6:
                        r = _a.sent();
                        expect(r).to.have.a.stakeChangedEvent({
                            addr: v1.address,
                            committeeStake: new bn_js_1.default(1000),
                        });
                        return [4 /*yield*/, v2.stake(1)];
                    case 7:
                        r = _a.sent();
                        expect(r).to.have.a.stakeChangedEvent({
                            addr: v1.address,
                            committeeStake: new bn_js_1.default(1000),
                        });
                        return [4 /*yield*/, v2.unstake(2)];
                    case 8:
                        r = _a.sent();
                        expect(r).to.have.a.stakeChangedEvent({
                            addr: v1.address,
                            committeeStake: new bn_js_1.default(999),
                        });
                        return [4 /*yield*/, v2.stake(11)];
                    case 9:
                        r = _a.sent();
                        expect(r).to.have.a.stakeChangedEvent({
                            addr: v1.address,
                            committeeStake: new bn_js_1.default(1000),
                        });
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [v1.address],
                            stakes: [new bn_js_1.default(1000)]
                        });
                        return [4 /*yield*/, v1.stake(2)];
                    case 10:
                        r = _a.sent();
                        expect(r).to.have.a.stakeChangedEvent({
                            addr: v1.address,
                            committeeStake: new bn_js_1.default(1012),
                        });
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [v1.address],
                            stakes: [new bn_js_1.default(1012)]
                        });
                        return [4 /*yield*/, v2.stake(30)];
                    case 11:
                        r = _a.sent();
                        expect(r).to.have.a.stakeChangedEvent({
                            addr: v1.address,
                            committeeStake: new bn_js_1.default(1020),
                        });
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [v1.address],
                            stakes: [new bn_js_1.default(1020)]
                        });
                        return [4 /*yield*/, v1.stake(1)];
                    case 12:
                        r = _a.sent();
                        expect(r).to.have.a.stakeChangedEvent({
                            addr: v1.address,
                            committeeStake: new bn_js_1.default(1030),
                        });
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [v1.address],
                            stakes: [new bn_js_1.default(1030)]
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('ensures validator who delegated cannot join committee even when owning enough stake', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, v1, v2, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        v1 = d.newParticipant();
                        v2 = d.newParticipant();
                        return [4 /*yield*/, v1.delegate(v2)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, v1.stake(driver_1.DEFAULT_MINIMUM_STAKE)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, v1.registerAsValidator()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, v1.notifyReadyForCommittee()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, v2.registerAsValidator()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, v2.notifyReadyForCommittee()];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, v2.stake(driver_1.DEFAULT_MINIMUM_STAKE)];
                    case 8:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [v2.address],
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('ensures a non-ready validator cannot join the committee even when owning enough stake', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, v, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        v = d.newParticipant();
                        return [4 /*yield*/, v.registerAsValidator()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, v.stake(driver_1.DEFAULT_MINIMUM_STAKE)];
                    case 3:
                        r = _a.sent();
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: [v.orbsAddress]
                        });
                        expect(r).to.not.have.a.committeeChangedEvent();
                        return [4 /*yield*/, v.notifyReadyForCommittee()];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            orbsAddrs: [v.orbsAddress]
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('publishes a CommiteeChangedEvent when the commitee becomes empty', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, v, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        v = d.newParticipant();
                        return [4 /*yield*/, v.registerAsValidator()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, v.stake(driver_1.DEFAULT_MINIMUM_STAKE)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, v.notifyReadyForCommittee()];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: [v.address]
                        });
                        return [4 /*yield*/, v.unstake(driver_1.DEFAULT_MINIMUM_STAKE)];
                    case 5:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            addrs: []
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('ignores ReadyForCommittee state when electing candidates', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, r, topology, newValidator, newValidator2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, Promise.all(_.range(driver_1.DEFAULT_TOPOLOGY_SIZE, 0, -1).map(function (i) { return __awaiter(void 0, void 0, void 0, function () {
                                var v;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            v = d.newParticipant();
                                            return [4 /*yield*/, v.registerAsValidator()];
                                        case 1:
                                            _a.sent();
                                            return [4 /*yield*/, v.notifyReadyForCommittee()];
                                        case 2:
                                            _a.sent();
                                            return [4 /*yield*/, v.stake(driver_1.DEFAULT_MINIMUM_STAKE * i)];
                                        case 3:
                                            r = _a.sent();
                                            return [2 /*return*/, v];
                                    }
                                });
                            }); }))];
                    case 2:
                        topology = _a.sent();
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: topology.map(function (v) { return v.orbsAddress; })
                        });
                        newValidator = d.newParticipant();
                        return [4 /*yield*/, newValidator.registerAsValidator()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, newValidator.stake(driver_1.DEFAULT_MINIMUM_STAKE * 2)];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: topology.slice(0, driver_1.DEFAULT_TOPOLOGY_SIZE - 1).map(function (v) { return v.orbsAddress; }).concat(newValidator.orbsAddress)
                        });
                        newValidator2 = d.newParticipant();
                        return [4 /*yield*/, newValidator2.registerAsValidator()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, newValidator2.notifyReadyForCommittee()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, newValidator2.stake(driver_1.DEFAULT_MINIMUM_STAKE)];
                    case 7:
                        r = _a.sent();
                        expect(r).to.not.have.a.topologyChangedEvent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("updates validator metadata only for registered validators", function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, p, r, newIp, newAddr, nonRegistered;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        p = d.newParticipant();
                        return [4 /*yield*/, p.registerAsValidator()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, p.stake(driver_1.DEFAULT_MINIMUM_STAKE)];
                    case 3:
                        r = _a.sent();
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: [p.orbsAddress]
                        });
                        newIp = "0x11223344";
                        return [4 /*yield*/, d.elections.setValidatorIp(newIp, { from: p.address })];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.topologyChangedEvent({
                            ips: [newIp]
                        });
                        return [4 /*yield*/, p.notifyReadyForCommittee()];
                    case 5:
                        _a.sent();
                        newAddr = d.newParticipant().address;
                        return [4 /*yield*/, d.elections.setValidatorOrbsAddress(newAddr, { from: p.address })];
                    case 6:
                        r = _a.sent();
                        expect(r).to.have.a.topologyChangedEvent({
                            ips: [newIp],
                            orbsAddrs: [newAddr]
                        });
                        expect(r).to.have.a.committeeChangedEvent({
                            orbsAddrs: [newAddr]
                        });
                        nonRegistered = d.newParticipant();
                        return [4 /*yield*/, driver_1.expectRejected(d.elections.setValidatorIp(newIp, { from: nonRegistered.address }))];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, driver_1.expectRejected(d.elections.setValidatorOrbsAddress(newAddr, { from: nonRegistered.address }))];
                    case 8:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("performs a batch refresh of stakes", function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, v1, v2, delegator, r, newStaking, anonymous;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        v1 = d.newParticipant();
                        return [4 /*yield*/, v1.registerAsValidator()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, v1.notifyReadyForCommittee()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, v1.stake(driver_1.DEFAULT_MINIMUM_STAKE * 2)];
                    case 4:
                        _a.sent();
                        v2 = d.newParticipant();
                        return [4 /*yield*/, v2.registerAsValidator()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, v2.notifyReadyForCommittee()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, v2.stake(driver_1.DEFAULT_MINIMUM_STAKE)];
                    case 7:
                        _a.sent();
                        delegator = d.newParticipant();
                        return [4 /*yield*/, delegator.stake(driver_1.DEFAULT_MINIMUM_STAKE * 2)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, delegator.delegate(v2)];
                    case 9:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            orbsAddrs: [v2, v1].map(function (v) { return v.orbsAddress; }),
                            stakes: helpers_1.bn([driver_1.DEFAULT_MINIMUM_STAKE * 3, driver_1.DEFAULT_MINIMUM_STAKE * 2])
                        });
                        return [4 /*yield*/, driver_1.Driver.newStakingContract(d.elections.address, d.erc20.address)];
                    case 10:
                        newStaking = _a.sent();
                        return [4 /*yield*/, d.contractRegistry.set("staking", newStaking.address)];
                    case 11:
                        _a.sent();
                        return [4 /*yield*/, v1.stake(driver_1.DEFAULT_MINIMUM_STAKE * 5, newStaking)];
                    case 12:
                        _a.sent();
                        return [4 /*yield*/, v2.stake(driver_1.DEFAULT_MINIMUM_STAKE * 3, newStaking)];
                    case 13:
                        _a.sent();
                        return [4 /*yield*/, delegator.stake(driver_1.DEFAULT_MINIMUM_STAKE, newStaking)];
                    case 14:
                        _a.sent();
                        anonymous = d.newParticipant();
                        return [4 /*yield*/, d.elections.refreshStakes([v1.address, v2.address, delegator.address], { from: anonymous.address })];
                    case 15:
                        r = _a.sent();
                        expect(r).to.have.a.committeeChangedEvent({
                            orbsAddrs: [v1, v2].map(function (v) { return v.orbsAddress; }),
                            stakes: helpers_1.bn([driver_1.DEFAULT_MINIMUM_STAKE * 5, driver_1.DEFAULT_MINIMUM_STAKE * 4])
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it("allows voting only to 3 at a time", function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, _a, thresholdCrossingIndex, delegatees, delegators, bannedValidator;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new(driver_1.DEFAULT_COMMITTEE_SIZE, driver_1.DEFAULT_TOPOLOGY_SIZE, 0)];
                    case 1:
                        d = _b.sent();
                        return [4 /*yield*/, banningScenario_setupDelegatorsAndValidators(d)];
                    case 2:
                        _a = _b.sent(), thresholdCrossingIndex = _a.thresholdCrossingIndex, delegatees = _a.delegatees, delegators = _a.delegators, bannedValidator = _a.bannedValidator;
                        // -------------- VOTE FOR 3 VALIDATORS AT MOST ---------------
                        return [4 /*yield*/, driver_1.expectRejected(d.elections.setBanningVotes(delegatees.slice(0, 4).map(function (v) { return v.address; }), { from: delegators[0].address }))];
                    case 3:
                        // -------------- VOTE FOR 3 VALIDATORS AT MOST ---------------
                        _b.sent();
                        return [4 /*yield*/, d.elections.setBanningVotes(delegatees.slice(0, 3).map(function (v) { return v.address; }), { from: delegators[0].address })];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("does not count delegators voting - because they don't have effective governance stake", function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, r, _a, thresholdCrossingIndex, delegatees, delegators, bannedValidator, _i, delegators_1, delegator;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new(driver_1.DEFAULT_COMMITTEE_SIZE, driver_1.DEFAULT_TOPOLOGY_SIZE, 0)];
                    case 1:
                        d = _b.sent();
                        return [4 /*yield*/, banningScenario_setupDelegatorsAndValidators(d)];
                    case 2:
                        _a = _b.sent(), thresholdCrossingIndex = _a.thresholdCrossingIndex, delegatees = _a.delegatees, delegators = _a.delegators, bannedValidator = _a.bannedValidator;
                        _i = 0, delegators_1 = delegators;
                        _b.label = 3;
                    case 3:
                        if (!(_i < delegators_1.length)) return [3 /*break*/, 6];
                        delegator = delegators_1[_i];
                        return [4 /*yield*/, d.elections.setBanningVotes([bannedValidator.address], { from: delegator.address })];
                    case 4:
                        r = _b.sent();
                        expect(r).to.have.a.banningVoteEvent({
                            voter: delegator.address,
                            against: [bannedValidator.address]
                        });
                        expect(r).to.not.have.a.topologyChangedEvent();
                        expect(r).to.not.have.a.bannedEvent();
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/];
                }
            });
        }); });
        it("bans a validator only when accumulated votes stake reaches the threshold", function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, r, _a, thresholdCrossingIndex, delegatees, delegators, bannedValidator, i, p;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new(driver_1.DEFAULT_COMMITTEE_SIZE, driver_1.DEFAULT_TOPOLOGY_SIZE, 0)];
                    case 1:
                        d = _b.sent();
                        return [4 /*yield*/, banningScenario_setupDelegatorsAndValidators(d)];
                    case 2:
                        _a = _b.sent(), thresholdCrossingIndex = _a.thresholdCrossingIndex, delegatees = _a.delegatees, delegators = _a.delegators, bannedValidator = _a.bannedValidator;
                        i = 0;
                        _b.label = 3;
                    case 3:
                        if (!(i < thresholdCrossingIndex)) return [3 /*break*/, 6];
                        p = delegatees[i];
                        return [4 /*yield*/, d.elections.setBanningVotes([bannedValidator.address], { from: p.address })];
                    case 4:
                        r = _b.sent();
                        expect(r).to.have.a.banningVoteEvent({
                            voter: p.address,
                            against: [bannedValidator.address]
                        });
                        expect(r).to.not.have.a.topologyChangedEvent();
                        expect(r).to.not.have.a.bannedEvent();
                        expect(r).to.not.have.a.unbannedEvent();
                        _b.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 3];
                    case 6: return [4 /*yield*/, d.elections.setBanningVotes([bannedValidator.address], { from: delegatees[thresholdCrossingIndex].address })];
                    case 7:
                        // -------------- ONE MORE VOTE TO REACH BANNING THRESHOLD ---------------
                        r = _b.sent(); // threshold is crossed
                        expect(r).to.have.a.banningVoteEvent({
                            voter: delegatees[thresholdCrossingIndex].address,
                            against: [bannedValidator.address]
                        });
                        expect(r).to.have.a.bannedEvent({
                            validator: bannedValidator.address
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: []
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it("can revoke a vote and unban a validator as a result", function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, r, _a, thresholdCrossingIndex, delegatees, delegators, bannedValidator;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new(driver_1.DEFAULT_COMMITTEE_SIZE, driver_1.DEFAULT_TOPOLOGY_SIZE, 0)];
                    case 1:
                        d = _b.sent();
                        return [4 /*yield*/, banningScenario_setupDelegatorsAndValidators(d)];
                    case 2:
                        _a = _b.sent(), thresholdCrossingIndex = _a.thresholdCrossingIndex, delegatees = _a.delegatees, delegators = _a.delegators, bannedValidator = _a.bannedValidator;
                        return [4 /*yield*/, banningScenario_voteUntilThresholdReached(d, thresholdCrossingIndex, delegatees, bannedValidator)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, d.elections.setBanningVotes([], { from: delegatees[thresholdCrossingIndex].address })];
                    case 4:
                        // -------------- BANNING VOTES REVOKED BY VALIDATOR ---------------
                        r = _b.sent(); // threshold is again uncrossed
                        expect(r).to.have.a.banningVoteEvent({
                            voter: delegatees[thresholdCrossingIndex].address,
                            against: []
                        });
                        expect(r).to.have.a.unbannedEvent({
                            validator: bannedValidator.address
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: [bannedValidator.orbsAddress]
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it("banning does not responds to changes in staking, delegating or voting after locking (one week)", function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, r, _a, thresholdCrossingIndex, delegatees, delegators, bannedValidator, tempStake, dilutingParticipant, dilutingStake, existingVotes, tipValidator, other, tipDelegator;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new(driver_1.DEFAULT_COMMITTEE_SIZE, driver_1.DEFAULT_TOPOLOGY_SIZE, 0)];
                    case 1:
                        d = _b.sent();
                        return [4 /*yield*/, banningScenario_setupDelegatorsAndValidators(d)];
                    case 2:
                        _a = _b.sent(), thresholdCrossingIndex = _a.thresholdCrossingIndex, delegatees = _a.delegatees, delegators = _a.delegators, bannedValidator = _a.bannedValidator;
                        return [4 /*yield*/, banningScenario_voteUntilThresholdReached(d, thresholdCrossingIndex, delegatees, bannedValidator)];
                    case 3:
                        _b.sent();
                        // ...*.* TiMe wArP *.*.....
                        helpers_1.evmIncreaseTime(driver_1.BANNING_LOCK_TIMEOUT);
                        return [4 /*yield*/, d.elections.setBanningVotes([], { from: delegatees[thresholdCrossingIndex].address })];
                    case 4:
                        // -----------------------------------------------------------------------------------
                        // -------------- AFTER BANNING LOCKED - TRY TO UNBAN AND ALWAYS FAIL: ---------------
                        // -----------------------------------------------------------------------------------
                        // -------------- BANNING VOTES REVOKED BY VALIDATOR ---------------
                        r = _b.sent(); // threshold is again uncrossed
                        expect(r).to.not.have.a.unbannedEvent();
                        expect(r).to.not.have.a.topologyChangedEvent();
                        return [4 /*yield*/, d.staking.getStakeBalanceOf(delegators[thresholdCrossingIndex].address)];
                    case 5:
                        tempStake = _b.sent();
                        return [4 /*yield*/, d.staking.unstake(tempStake, { from: delegators[thresholdCrossingIndex].address })];
                    case 6:
                        r = _b.sent(); // threshold is un-crossed
                        expect(r).to.not.have.a.unbannedEvent();
                        expect(r).to.not.have.a.topologyChangedEvent();
                        dilutingParticipant = d.newParticipant();
                        dilutingStake = driver_1.DEFAULT_MINIMUM_STAKE * driver_1.DEFAULT_BANNING_THRESHOLD * 200;
                        return [4 /*yield*/, dilutingParticipant.stake(dilutingStake)];
                    case 7:
                        _b.sent();
                        expect(r).to.not.have.a.unbannedEvent(); // because we need a trigger to detect the change
                        expect(r).to.not.have.a.topologyChangedEvent();
                        return [4 /*yield*/, d.elections.getBanningVotes(delegatees[0].address)];
                    case 8:
                        existingVotes = _b.sent();
                        return [4 /*yield*/, d.elections.setBanningVotes(existingVotes, { from: delegatees[0].address })];
                    case 9:
                        r = _b.sent();
                        expect(r).to.not.have.a.unbannedEvent();
                        expect(r).to.not.have.a.topologyChangedEvent();
                        tipValidator = delegatees[thresholdCrossingIndex];
                        other = d.newParticipant();
                        return [4 /*yield*/, d.elections.delegate(other.address, { from: tipValidator.address })];
                    case 10:
                        r = _b.sent(); // delegates to someone else
                        expect(r).to.not.have.a.unbannedEvent();
                        expect(r).to.not.have.a.topologyChangedEvent();
                        tipDelegator = delegators[thresholdCrossingIndex];
                        return [4 /*yield*/, d.elections.delegate(other.address, { from: tipDelegator.address })];
                    case 11:
                        r = _b.sent(); // delegates to someone else
                        expect(r).to.not.have.a.unbannedEvent();
                        expect(r).to.not.have.a.topologyChangedEvent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("banning responds to changes in staking and delegating before locking", function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, r, _a, thresholdCrossingIndex, delegatees, delegators, bannedValidator, tempStake, originalTotalStake, dilutingParticipant, dilutingStake, existingVotes, tipValidator, other, tipDelegator;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new(driver_1.DEFAULT_COMMITTEE_SIZE, driver_1.DEFAULT_TOPOLOGY_SIZE, 0)];
                    case 1:
                        d = _b.sent();
                        return [4 /*yield*/, banningScenario_setupDelegatorsAndValidators(d)];
                    case 2:
                        _a = _b.sent(), thresholdCrossingIndex = _a.thresholdCrossingIndex, delegatees = _a.delegatees, delegators = _a.delegators, bannedValidator = _a.bannedValidator;
                        return [4 /*yield*/, banningScenario_voteUntilThresholdReached(d, thresholdCrossingIndex, delegatees, bannedValidator)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, d.staking.getStakeBalanceOf(delegators[thresholdCrossingIndex].address)];
                    case 4:
                        tempStake = _b.sent();
                        return [4 /*yield*/, d.staking.unstake(tempStake, { from: delegators[thresholdCrossingIndex].address })];
                    case 5:
                        r = _b.sent(); // threshold is un-crossed
                        expect(r).to.have.a.unbannedEvent({
                            validator: bannedValidator.address
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: [bannedValidator.orbsAddress]
                        });
                        return [4 /*yield*/, d.staking.restake({ from: delegators[thresholdCrossingIndex].address })];
                    case 6:
                        r = _b.sent(); // threshold is crossed again
                        expect(r).to.have.a.bannedEvent({
                            validator: bannedValidator.address
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: []
                        });
                        return [4 /*yield*/, d.elections.getTotalGovernanceStake()];
                    case 7:
                        originalTotalStake = _b.sent();
                        dilutingParticipant = d.newParticipant();
                        dilutingStake = driver_1.DEFAULT_MINIMUM_STAKE * driver_1.DEFAULT_BANNING_THRESHOLD * 200;
                        return [4 /*yield*/, dilutingParticipant.stake(dilutingStake)];
                    case 8:
                        r = _b.sent();
                        expect(r).to.not.have.a.topologyChangedEvent(); // because we need a trigger to detect the change
                        expect(r).to.not.have.a.bannedEvent();
                        expect(r).to.not.have.a.unbannedEvent();
                        return [4 /*yield*/, d.elections.getBanningVotes(delegatees[0].address)];
                    case 9:
                        existingVotes = _b.sent();
                        return [4 /*yield*/, d.elections.setBanningVotes(existingVotes, { from: delegatees[0].address })];
                    case 10:
                        r = _b.sent();
                        expect(r).to.have.a.unbannedEvent({
                            validator: bannedValidator.address
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: [bannedValidator.orbsAddress]
                        });
                        return [4 /*yield*/, d.staking.unstake(dilutingStake, { from: dilutingParticipant.address })];
                    case 11:
                        r = _b.sent(); // threshold is again crossed
                        expect(r).to.not.have.a.topologyChangedEvent(); // because we need a trigger to detect the change
                        expect(r).to.not.have.a.bannedEvent();
                        expect(r).to.not.have.a.unbannedEvent();
                        return [4 /*yield*/, d.elections.setBanningVotes(existingVotes, { from: delegatees[0].address })];
                    case 12:
                        // trigger - repeat an existing vote:
                        r = _b.sent();
                        expect(r).to.have.a.bannedEvent({
                            validator: bannedValidator.address
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: []
                        });
                        tipValidator = delegatees[thresholdCrossingIndex];
                        other = d.newParticipant();
                        return [4 /*yield*/, d.elections.delegate(other.address, { from: tipValidator.address })];
                    case 13:
                        r = _b.sent(); // delegates to someone else
                        expect(r).to.have.a.unbannedEvent({
                            validator: bannedValidator.address
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: [bannedValidator.orbsAddress]
                        });
                        return [4 /*yield*/, d.elections.delegate(tipValidator.address, { from: tipValidator.address })];
                    case 14:
                        r = _b.sent(); // self delegation
                        expect(r).to.have.a.bannedEvent({
                            validator: bannedValidator.address
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: []
                        });
                        tipDelegator = delegators[thresholdCrossingIndex];
                        return [4 /*yield*/, d.elections.delegate(other.address, { from: tipDelegator.address })];
                    case 15:
                        r = _b.sent(); // delegates to someone else
                        expect(r).to.have.a.unbannedEvent({
                            validator: bannedValidator.address
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: [bannedValidator.orbsAddress]
                        });
                        return [4 /*yield*/, d.elections.delegate(tipValidator.address, { from: tipDelegator.address })];
                    case 16:
                        r = _b.sent(); // self delegation
                        expect(r).to.have.a.bannedEvent({
                            validator: bannedValidator.address
                        });
                        expect(r).to.have.a.topologyChangedEvent({
                            orbsAddrs: []
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
function banningScenario_setupDelegatorsAndValidators(driver) {
    return __awaiter(this, void 0, void 0, function () {
        var stakesPercentage, thresholdCrossingIndex, delegatees, delegators, _i, stakesPercentage_2, p, delegator, v, bannedValidator, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assert(driver_1.DEFAULT_BANNING_THRESHOLD < 98); // so each committee member will hold a positive stake
                    assert(Math.floor(driver_1.DEFAULT_BANNING_THRESHOLD / 2) >= 98 - driver_1.DEFAULT_BANNING_THRESHOLD); // so the committee list will be ordered by stake
                    stakesPercentage = [
                        Math.ceil(driver_1.DEFAULT_BANNING_THRESHOLD / 2),
                        Math.floor(driver_1.DEFAULT_BANNING_THRESHOLD / 2),
                        98 - driver_1.DEFAULT_BANNING_THRESHOLD,
                        1,
                        1
                    ];
                    thresholdCrossingIndex = 1;
                    delegatees = [];
                    delegators = [];
                    _i = 0, stakesPercentage_2 = stakesPercentage;
                    _a.label = 1;
                case 1:
                    if (!(_i < stakesPercentage_2.length)) return [3 /*break*/, 5];
                    p = stakesPercentage_2[_i];
                    delegator = driver.newParticipant();
                    return [4 /*yield*/, delegator.stake(driver_1.DEFAULT_MINIMUM_STAKE * p)];
                case 2:
                    _a.sent();
                    v = driver.newParticipant();
                    return [4 /*yield*/, delegator.delegate(v)];
                case 3:
                    _a.sent();
                    delegatees.push(v);
                    delegators.push(delegator);
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5:
                    bannedValidator = delegatees[delegatees.length - 1];
                    return [4 /*yield*/, bannedValidator.registerAsValidator()];
                case 6:
                    r = _a.sent();
                    expect(r).to.have.a.topologyChangedEvent({
                        orbsAddrs: [bannedValidator.orbsAddress]
                    });
                    return [2 /*return*/, { thresholdCrossingIndex: thresholdCrossingIndex, delegatees: delegatees, delegators: delegators, bannedValidator: bannedValidator }];
            }
        });
    });
}
function banningScenario_voteUntilThresholdReached(driver, thresholdCrossingIndex, delegatees, bannedValidator) {
    return __awaiter(this, void 0, void 0, function () {
        var r, i, p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i <= thresholdCrossingIndex)) return [3 /*break*/, 4];
                    p = delegatees[i];
                    return [4 /*yield*/, driver.elections.setBanningVotes([bannedValidator.address], { from: p.address })];
                case 2:
                    r = _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    expect(r).to.have.a.banningVoteEvent({
                        voter: delegatees[thresholdCrossingIndex].address,
                        against: [bannedValidator.address]
                    });
                    expect(r).to.have.a.bannedEvent({
                        validator: bannedValidator.address
                    });
                    expect(r).to.have.a.topologyChangedEvent({
                        orbsAddrs: []
                    });
                    return [2 /*return*/];
            }
        });
    });
}
