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
var bn_js_1 = __importDefault(require("bn.js"));
var chai_1 = __importDefault(require("chai"));
chai_1.default.use(require('chai-bn')(bn_js_1.default));
exports.ZERO_ADDR = "0x0000000000000000000000000000000000000000";
var eth_1 = require("../eth");
exports.DEFAULT_MINIMUM_STAKE = 100;
exports.DEFAULT_COMMITTEE_SIZE = 2;
exports.DEFAULT_TOPOLOGY_SIZE = 3;
exports.DEFAULT_MAX_DELEGATION_RATIO = 10;
exports.DEFAULT_VOTE_OUT_THRESHOLD = 80;
exports.DEFAULT_BANNING_THRESHOLD = 80;
exports.DEFAULT_VOTE_OUT_TIMEOUT = 24 * 60 * 60;
exports.BANNING_LOCK_TIMEOUT = 7 * 24 * 60 * 60;
exports.DEPLOYMENT_SUBSET_MAIN = "main";
exports.DEPLOYMENT_SUBSET_CANARY = "canary";
var Driver = /** @class */ (function () {
    function Driver(accounts, elections, erc20, externalToken, staking, subscriptions, rewards, protocol, contractRegistry) {
        this.accounts = accounts;
        this.elections = elections;
        this.erc20 = erc20;
        this.externalToken = externalToken;
        this.staking = staking;
        this.subscriptions = subscriptions;
        this.rewards = rewards;
        this.protocol = protocol;
        this.contractRegistry = contractRegistry;
        this.participants = [];
    }
    Driver.new = function (maxCommitteeSize, maxTopologySize, minimumStake, maxDelegationRatio, voteOutThreshold, voteOutTimeout, banningThreshold) {
        if (maxCommitteeSize === void 0) { maxCommitteeSize = exports.DEFAULT_COMMITTEE_SIZE; }
        if (maxTopologySize === void 0) { maxTopologySize = exports.DEFAULT_TOPOLOGY_SIZE; }
        if (minimumStake === void 0) { minimumStake = exports.DEFAULT_MINIMUM_STAKE; }
        if (maxDelegationRatio === void 0) { maxDelegationRatio = exports.DEFAULT_MAX_DELEGATION_RATIO; }
        if (voteOutThreshold === void 0) { voteOutThreshold = exports.DEFAULT_VOTE_OUT_THRESHOLD; }
        if (voteOutTimeout === void 0) { voteOutTimeout = exports.DEFAULT_VOTE_OUT_TIMEOUT; }
        if (banningThreshold === void 0) { banningThreshold = exports.DEFAULT_BANNING_THRESHOLD; }
        return __awaiter(this, void 0, void 0, function () {
            var accounts, contractRegistry, externalToken, erc20, rewards, elections, staking, subscriptions, protocol;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, eth_1.web3.eth.getAccounts()];
                    case 1:
                        accounts = _a.sent();
                        return [4 /*yield*/, eth_1.deploy('ContractRegistry', [accounts[0]])];
                    case 2:
                        contractRegistry = _a.sent();
                        return [4 /*yield*/, eth_1.deploy('TestingERC20', [])];
                    case 3:
                        externalToken = _a.sent();
                        return [4 /*yield*/, eth_1.deploy('TestingERC20', [])];
                    case 4:
                        erc20 = _a.sent();
                        return [4 /*yield*/, eth_1.deploy('Rewards', [erc20.address, externalToken.address, accounts[0]])];
                    case 5:
                        rewards = _a.sent();
                        return [4 /*yield*/, eth_1.deploy("Elections", [maxCommitteeSize, maxTopologySize, minimumStake, maxDelegationRatio, voteOutThreshold, voteOutTimeout, banningThreshold])];
                    case 6:
                        elections = _a.sent();
                        return [4 /*yield*/, Driver.newStakingContract(elections.address, erc20.address)];
                    case 7:
                        staking = _a.sent();
                        return [4 /*yield*/, eth_1.deploy('Subscriptions', [erc20.address])];
                    case 8:
                        subscriptions = _a.sent();
                        return [4 /*yield*/, eth_1.deploy('Protocol', [])];
                    case 9:
                        protocol = _a.sent();
                        return [4 /*yield*/, contractRegistry.set("staking", staking.address)];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, contractRegistry.set("rewards", rewards.address)];
                    case 11:
                        _a.sent();
                        return [4 /*yield*/, contractRegistry.set("elections", elections.address)];
                    case 12:
                        _a.sent();
                        return [4 /*yield*/, contractRegistry.set("subscriptions", subscriptions.address)];
                    case 13:
                        _a.sent();
                        return [4 /*yield*/, contractRegistry.set("protocol", protocol.address)];
                    case 14:
                        _a.sent();
                        return [4 /*yield*/, elections.setContractRegistry(contractRegistry.address)];
                    case 15:
                        _a.sent();
                        return [4 /*yield*/, rewards.setContractRegistry(contractRegistry.address)];
                    case 16:
                        _a.sent();
                        return [4 /*yield*/, subscriptions.setContractRegistry(contractRegistry.address)];
                    case 17:
                        _a.sent();
                        return [4 /*yield*/, protocol.setProtocolVersion(exports.DEPLOYMENT_SUBSET_MAIN, 1, 0)];
                    case 18:
                        _a.sent();
                        return [2 /*return*/, new Driver(accounts, elections, erc20, externalToken, staking, subscriptions, rewards, protocol, contractRegistry)];
                }
            });
        });
    };
    Driver.newContractRegistry = function (governorAddr) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, eth_1.web3.eth.getAccounts()];
                    case 1:
                        accounts = _a.sent();
                        return [4 /*yield*/, eth_1.deploy('ContractRegistry', [governorAddr], { from: accounts[0] })];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Driver.newStakingContract = function (electionsAddr, erc20Addr) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, staking;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, eth_1.web3.eth.getAccounts()];
                    case 1:
                        accounts = _a.sent();
                        return [4 /*yield*/, eth_1.deploy("StakingContract", [1 /* _cooldownPeriodInSec */, accounts[0] /* _migrationManager */, "0x0000000000000000000000000000000000000001" /* _emergencyManager */, erc20Addr /* _token */])];
                    case 2:
                        staking = _a.sent();
                        return [4 /*yield*/, staking.setStakeChangeNotifier(electionsAddr, { from: accounts[0] })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, staking];
                }
            });
        });
    };
    Object.defineProperty(Driver.prototype, "contractsOwner", {
        get: function () {
            return this.accounts[0];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Driver.prototype, "contractsNonOwner", {
        get: function () {
            return this.accounts[1];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Driver.prototype, "rewardsGovernor", {
        get: function () {
            return new Participant(this.accounts[0], this.accounts[0], this);
        },
        enumerable: true,
        configurable: true
    });
    Driver.prototype.newSubscriber = function (tier, monthlyRate) {
        return __awaiter(this, void 0, void 0, function () {
            var subscriber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, eth_1.deploy('MonthlySubscriptionPlan', [this.erc20.address, tier, monthlyRate])];
                    case 1:
                        subscriber = _a.sent();
                        return [4 /*yield*/, subscriber.setContractRegistry(this.contractRegistry.address)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.subscriptions.addSubscriber(subscriber.address)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, subscriber];
                }
            });
        });
    };
    Driver.prototype.newParticipant = function () {
        var RESERVED_ACCOUNTS = 2;
        var v = new Participant(this.accounts[RESERVED_ACCOUNTS + this.participants.length * 2], this.accounts[RESERVED_ACCOUNTS + this.participants.length * 2 + 1], this);
        this.participants.push(v);
        return v;
    };
    Driver.prototype.delegateMoreStake = function (amount, delegatee) {
        return __awaiter(this, void 0, void 0, function () {
            var delegator;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        delegator = this.newParticipant();
                        return [4 /*yield*/, delegator.stake(new bn_js_1.default(amount))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, delegator.delegate(delegatee)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return Driver;
}());
exports.Driver = Driver;
var Participant = /** @class */ (function () {
    function Participant(address, orbsAddress, driver) {
        this.address = address;
        this.orbsAddress = orbsAddress;
        this.ip = address.substring(0, 10).toLowerCase();
        this.erc20 = driver.erc20;
        this.externalToken = driver.externalToken;
        this.staking = driver.staking;
        this.elections = driver.elections;
    }
    Participant.prototype.stake = function (amount, staking) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        staking = staking || this.staking;
                        return [4 /*yield*/, this.assignAndApproveOrbs(amount, staking.address)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, staking.stake(amount, { from: this.address })];
                }
            });
        });
    };
    Participant.prototype.assignAndApprove = function (amount, to, token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, token.assign(this.address, amount)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, token.approve(to, amount, { from: this.address })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Participant.prototype.assignAndApproveOrbs = function (amount, to) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assignAndApprove(amount, to, this.erc20)];
            });
        });
    };
    Participant.prototype.assignAndApproveExternalToken = function (amount, to) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.assignAndApprove(amount, to, this.externalToken)];
            });
        });
    };
    Participant.prototype.unstake = function (amount) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.staking.unstake(amount, { from: this.address })];
            });
        });
    };
    Participant.prototype.delegate = function (to) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.elections.delegate(to.address, { from: this.address })];
            });
        });
    };
    Participant.prototype.registerAsValidator = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.elections.registerValidator(this.ip, this.orbsAddress, { from: this.address })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Participant.prototype.notifyReadyForCommittee = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.elections.notifyReadyForCommittee({ from: this.orbsAddress })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return Participant;
}());
exports.Participant = Participant;
function expectRejected(promise, msg) {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, promise];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    // TODO verify correct error
                    return [2 /*return*/];
                case 3: throw new Error(msg || "expected promise to reject");
            }
        });
    });
}
exports.expectRejected = expectRejected;
