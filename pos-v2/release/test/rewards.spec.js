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
var event_parsing_1 = require("./event-parsing");
var helpers_1 = require("./helpers");
var eth_1 = require("../eth");
chai_1.default.use(require('chai-bn')(bn_js_1.default));
chai_1.default.use(require('./matchers'));
var MONTH_IN_SECONDS = 30 * 24 * 60 * 60;
function txTimestamp(r) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, eth_1.web3.eth.getBlock(r.blockNumber)];
                case 1: // TODO move
                return [2 /*return*/, (_a.sent()).timestamp];
            }
        });
    });
}
var expect = chai_1.default.expect;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
        });
    });
}
describe('rewards-level-flows', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        it('should distribute fees to validators in committee', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, g, fixedPoolRate, fixedPoolAmount, proRataPoolRate, proRataPoolAmount, initStakeLesser, v1, initStakeLarger, v2, validators, nValidators, vcRate, subs, appOwner, payment, r, startTime, feeBuckets, totalAdded, secondsInFirstMonth, middleBuckets, _a, initialOrbsBalances, initialExternalBalances, _b, validators_1, v, _c, _d, _e, _f, _g, _h, endTime, elapsedTime, calcRewards, calcFeeRewards, expectedFeesRewardsArr, expectedProRataPoolRewardsArr, expectedFixedPoolRewardsArr, totalOrbsRewardsArr, totalExternalTokenRewardsArr, orbsBalances, externalBalances, _j, validators_2, v, _k, _l, _m, _o, _p, _q, _loop_1, _r, validators_3, v;
            return __generator(this, function (_s) {
                switch (_s.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _s.sent();
                        g = d.rewardsGovernor;
                        fixedPoolRate = 10000000;
                        fixedPoolAmount = fixedPoolRate * 12;
                        return [4 /*yield*/, d.rewards.setFixedPoolMonthlyRate(fixedPoolRate, { from: g.address })];
                    case 2:
                        _s.sent();
                        return [4 /*yield*/, g.assignAndApproveExternalToken(fixedPoolAmount, d.rewards.address)];
                    case 3:
                        _s.sent();
                        return [4 /*yield*/, d.rewards.topUpFixedPool(fixedPoolAmount, { from: g.address })];
                    case 4:
                        _s.sent();
                        proRataPoolRate = 2000000000;
                        proRataPoolAmount = proRataPoolRate * 12;
                        return [4 /*yield*/, d.rewards.setProRataPoolMonthlyRate(proRataPoolRate, { from: g.address })];
                    case 5:
                        _s.sent();
                        return [4 /*yield*/, g.assignAndApproveOrbs(proRataPoolAmount, d.rewards.address)];
                    case 6:
                        _s.sent();
                        return [4 /*yield*/, d.rewards.topUpProRataPool(proRataPoolAmount, { from: g.address })];
                    case 7:
                        _s.sent();
                        initStakeLesser = new bn_js_1.default(17000);
                        v1 = d.newParticipant();
                        return [4 /*yield*/, v1.stake(initStakeLesser)];
                    case 8:
                        _s.sent();
                        return [4 /*yield*/, v1.registerAsValidator()];
                    case 9:
                        _s.sent();
                        return [4 /*yield*/, v1.notifyReadyForCommittee()];
                    case 10:
                        _s.sent();
                        initStakeLarger = new bn_js_1.default(21000);
                        v2 = d.newParticipant();
                        return [4 /*yield*/, v2.stake(initStakeLarger)];
                    case 11:
                        _s.sent();
                        return [4 /*yield*/, v2.registerAsValidator()];
                    case 12:
                        _s.sent();
                        return [4 /*yield*/, v2.notifyReadyForCommittee()];
                    case 13:
                        _s.sent();
                        validators = [{
                                v: v2,
                                stake: initStakeLarger
                            }, {
                                v: v1,
                                stake: initStakeLesser
                            }];
                        nValidators = validators.length;
                        vcRate = 3000000000;
                        return [4 /*yield*/, d.newSubscriber('tier', vcRate)];
                    case 14:
                        subs = _s.sent();
                        appOwner = d.newParticipant();
                        payment = 12 * vcRate;
                        return [4 /*yield*/, d.erc20.assign(appOwner.address, payment)];
                    case 15:
                        _s.sent();
                        return [4 /*yield*/, d.erc20.approve(subs.address, payment, { from: appOwner.address })];
                    case 16:
                        _s.sent();
                        return [4 /*yield*/, subs.createVC(payment, driver_1.DEPLOYMENT_SUBSET_MAIN, { from: appOwner.address })];
                    case 17:
                        r = _s.sent();
                        return [4 /*yield*/, txTimestamp(r)];
                    case 18:
                        startTime = _s.sent();
                        feeBuckets = event_parsing_1.feeAddedToBucketEvents(r);
                        totalAdded = feeBuckets.reduce(function (t, l) { return t.add(new bn_js_1.default(l.added)); }, new bn_js_1.default(0));
                        expect(totalAdded).to.be.bignumber.equal(new bn_js_1.default(payment));
                        secondsInFirstMonth = parseInt(feeBuckets[1].bucketId) - startTime;
                        expect(parseInt(feeBuckets[0].added)).to.equal(Math.floor(secondsInFirstMonth * vcRate / MONTH_IN_SECONDS));
                        middleBuckets = feeBuckets.filter(function (l, i) { return i > 0 && i < feeBuckets.length - 1; });
                        expect(middleBuckets).to.have.length(feeBuckets.length - 2);
                        middleBuckets.forEach(function (l) {
                            expect(l.added).to.be.bignumber.equal(new bn_js_1.default(vcRate));
                        });
                        _a = expect;
                        return [4 /*yield*/, d.rewards.getLastPayedAt()];
                    case 19:
                        _a.apply(void 0, [_s.sent()]).to.be.bignumber.equal(new bn_js_1.default(startTime));
                        initialOrbsBalances = [];
                        initialExternalBalances = [];
                        _b = 0, validators_1 = validators;
                        _s.label = 20;
                    case 20:
                        if (!(_b < validators_1.length)) return [3 /*break*/, 24];
                        v = validators_1[_b];
                        _d = (_c = initialOrbsBalances).push;
                        _e = bn_js_1.default.bind;
                        return [4 /*yield*/, d.rewards.getOrbsBalance(v.v.address)];
                    case 21:
                        _d.apply(_c, [new (_e.apply(bn_js_1.default, [void 0, _s.sent()]))()]);
                        _g = (_f = initialExternalBalances).push;
                        _h = bn_js_1.default.bind;
                        return [4 /*yield*/, d.rewards.getExternalTokenBalance(v.v.address)];
                    case 22:
                        _g.apply(_f, [new (_h.apply(bn_js_1.default, [void 0, _s.sent()]))()]);
                        _s.label = 23;
                    case 23:
                        _b++;
                        return [3 /*break*/, 20];
                    case 24: return [4 /*yield*/, sleep(3000)];
                    case 25:
                        _s.sent();
                        return [4 /*yield*/, helpers_1.evmIncreaseTime(MONTH_IN_SECONDS * 4)];
                    case 26:
                        _s.sent();
                        return [4 /*yield*/, d.rewards.assignRewards()];
                    case 27:
                        r = _s.sent();
                        return [4 /*yield*/, txTimestamp(r)];
                    case 28:
                        endTime = _s.sent();
                        elapsedTime = endTime - startTime;
                        calcRewards = function (rate, type) {
                            var totalCommitteeStake = new bn_js_1.default(_.sumBy(validators, function (v) { return v.stake.toNumber(); }));
                            var rewards = new bn_js_1.default(Math.floor(rate * elapsedTime / MONTH_IN_SECONDS));
                            var rewardsArr = type == "fixed" ?
                                validators.map(function () { return rewards.div(new bn_js_1.default(validators.length)); })
                                :
                                    validators.map(function (v) { return rewards.mul(v.stake).div(totalCommitteeStake); });
                            var remainder = rewards.sub(new bn_js_1.default(_.sumBy(rewardsArr, function (r) { return r.toNumber(); })));
                            var remainderWinnerIdx = endTime % nValidators;
                            rewardsArr[remainderWinnerIdx] = rewardsArr[remainderWinnerIdx].add(remainder);
                            return rewardsArr;
                        };
                        calcFeeRewards = function () {
                            var rewards = 0;
                            for (var _a = 0, feeBuckets_1 = feeBuckets; _a < feeBuckets_1.length; _a++) {
                                var bucket = feeBuckets_1[_a];
                                var bucketStartTime = Math.max(parseInt(bucket.bucketId), startTime);
                                var bucketEndTime = bucketStartTime - (bucketStartTime % MONTH_IN_SECONDS) + MONTH_IN_SECONDS;
                                var bucketRemainingTime = bucketEndTime - bucketStartTime;
                                var bucketAmount = parseInt(bucket.added);
                                if (bucketStartTime < endTime) {
                                    var payedDuration = Math.min(endTime, bucketEndTime) - bucketStartTime;
                                    var amount = Math.floor(bucketAmount * payedDuration / bucketRemainingTime);
                                    rewards += amount;
                                }
                            }
                            var rewardsArr = validators.map(function () { return Math.floor(rewards / validators.length); });
                            var remainder = rewards - _.sum(rewardsArr);
                            var remainderWinnerIdx = endTime % nValidators;
                            rewardsArr[remainderWinnerIdx] = rewardsArr[remainderWinnerIdx] + remainder;
                            return rewardsArr.map(function (x) { return new bn_js_1.default(x); });
                        };
                        expectedFeesRewardsArr = calcFeeRewards();
                        expectedProRataPoolRewardsArr = calcRewards(proRataPoolRate, "prorata");
                        expectedFixedPoolRewardsArr = calcRewards(fixedPoolRate, "fixed");
                        totalOrbsRewardsArr = expectedFeesRewardsArr.map(function (r, i) { return r.add(expectedProRataPoolRewardsArr[i]); });
                        totalExternalTokenRewardsArr = expectedFixedPoolRewardsArr;
                        orbsBalances = [];
                        externalBalances = [];
                        _j = 0, validators_2 = validators;
                        _s.label = 29;
                    case 29:
                        if (!(_j < validators_2.length)) return [3 /*break*/, 33];
                        v = validators_2[_j];
                        _l = (_k = orbsBalances).push;
                        _m = bn_js_1.default.bind;
                        return [4 /*yield*/, d.rewards.getOrbsBalance(v.v.address)];
                    case 30:
                        _l.apply(_k, [new (_m.apply(bn_js_1.default, [void 0, _s.sent()]))()]);
                        _p = (_o = externalBalances).push;
                        _q = bn_js_1.default.bind;
                        return [4 /*yield*/, d.rewards.getExternalTokenBalance(v.v.address)];
                    case 31:
                        _p.apply(_o, [new (_q.apply(bn_js_1.default, [void 0, _s.sent()]))()]);
                        _s.label = 32;
                    case 32:
                        _j++;
                        return [3 /*break*/, 29];
                    case 33:
                        _loop_1 = function (v) {
                            var i, orbsBalance, externalTokenBalance, expectedBalance, _a, externalBalance;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        i = validators.indexOf(v);
                                        orbsBalance = orbsBalances[i].sub(initialOrbsBalances[i]);
                                        expect(orbsBalance).to.be.bignumber.equal(new bn_js_1.default(totalOrbsRewardsArr[i]));
                                        externalTokenBalance = externalBalances[i].sub(initialExternalBalances[i]);
                                        expect(externalTokenBalance).to.be.bignumber.equal(new bn_js_1.default(totalExternalTokenRewardsArr[i]));
                                        return [4 /*yield*/, d.rewards.distributeOrbsTokenRewards([v.v.address], [totalOrbsRewardsArr[i]], { from: v.v.address })];
                                    case 1:
                                        r = _b.sent();
                                        expect(r).to.have.a.stakedEvent({
                                            stakeOwner: v.v.address,
                                            amount: totalOrbsRewardsArr[i],
                                            totalStakedAmount: new bn_js_1.default(v.stake).add(totalOrbsRewardsArr[i])
                                        });
                                        expect(r).to.have.a.committeeChangedEvent({
                                            orbsAddrs: validators.map(function (v) { return v.v.orbsAddress; }),
                                            addrs: validators.map(function (v) { return v.v.address; }),
                                            stakes: validators.map(function (_v, _i) { return (_i <= i) ? new bn_js_1.default(_v.stake).add(totalOrbsRewardsArr[_i]) : new bn_js_1.default(_v.stake); })
                                        });
                                        _a = parseInt;
                                        return [4 /*yield*/, d.rewards.getExternalTokenBalance(v.v.address)];
                                    case 2:
                                        expectedBalance = _a.apply(void 0, [_b.sent()]);
                                        expect(expectedBalance).to.be.at.least(externalBalances[i].toNumber()); // at least - because new rewards may have already been assigned
                                        return [4 /*yield*/, d.rewards.withdrawExternalTokenRewards({ from: v.v.address })];
                                    case 3:
                                        _b.sent();
                                        return [4 /*yield*/, d.externalToken.balanceOf(v.v.address)];
                                    case 4:
                                        externalBalance = _b.sent();
                                        expect(new bn_js_1.default(externalBalance)).to.bignumber.equal(new bn_js_1.default(expectedBalance));
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _r = 0, validators_3 = validators;
                        _s.label = 34;
                    case 34:
                        if (!(_r < validators_3.length)) return [3 /*break*/, 37];
                        v = validators_3[_r];
                        return [5 /*yield**/, _loop_1(v)];
                    case 35:
                        _s.sent();
                        _s.label = 36;
                    case 36:
                        _r++;
                        return [3 /*break*/, 34];
                    case 37: return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
