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
var eth_1 = require("../eth");
chai_1.default.use(require('chai-bn')(bn_js_1.default));
chai_1.default.use(require('./matchers'));
var expect = chai_1.default.expect;
var helpers_1 = require("./helpers");
describe('protocol-contract', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        it('schedules a protocol version upgrade for the main, canary deployment subsets', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, curBlockNumber, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, new Promise(function (resolve, reject) { return eth_1.web3.eth.getBlockNumber(function (err, blockNumber) { return err ? reject(err) : resolve(blockNumber); }); })];
                    case 2:
                        curBlockNumber = _a.sent();
                        return [4 /*yield*/, d.protocol.setProtocolVersion(driver_1.DEPLOYMENT_SUBSET_MAIN, 2, curBlockNumber + 100)];
                    case 3:
                        r = _a.sent();
                        expect(r).to.have.a.protocolChangedEvent({
                            deploymentSubset: driver_1.DEPLOYMENT_SUBSET_MAIN,
                            protocolVersion: helpers_1.bn(2),
                            asOfBlock: helpers_1.bn(curBlockNumber + 100)
                        });
                        return [4 /*yield*/, d.protocol.setProtocolVersion("canary", 2, 0)];
                    case 4:
                        r = _a.sent();
                        expect(r).to.have.a.protocolChangedEvent({
                            deploymentSubset: "canary",
                            protocolVersion: helpers_1.bn(2),
                            asOfBlock: helpers_1.bn(0)
                        });
                        return [4 /*yield*/, d.protocol.setProtocolVersion("canary", 3, curBlockNumber + 100)];
                    case 5:
                        r = _a.sent();
                        expect(r).to.have.a.protocolChangedEvent({
                            deploymentSubset: "canary",
                            protocolVersion: helpers_1.bn(3),
                            asOfBlock: helpers_1.bn(curBlockNumber + 100)
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('does not allow protocol upgrade to be scheduled before the latest upgrade schedule', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, curBlockNumber, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, new Promise(function (resolve, reject) { return eth_1.web3.eth.getBlockNumber(function (err, blockNumber) { return err ? reject(err) : resolve(blockNumber); }); })];
                    case 2:
                        curBlockNumber = _a.sent();
                        return [4 /*yield*/, d.protocol.setProtocolVersion(driver_1.DEPLOYMENT_SUBSET_MAIN, 2, curBlockNumber + 100)];
                    case 3:
                        r = _a.sent();
                        expect(r).to.have.a.protocolChangedEvent({
                            deploymentSubset: driver_1.DEPLOYMENT_SUBSET_MAIN,
                            protocolVersion: helpers_1.bn(2),
                            asOfBlock: helpers_1.bn(curBlockNumber + 100)
                        });
                        return [4 /*yield*/, driver_1.expectRejected(d.protocol.setProtocolVersion(driver_1.DEPLOYMENT_SUBSET_MAIN, 3, curBlockNumber + 100))];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, driver_1.expectRejected(d.protocol.setProtocolVersion(driver_1.DEPLOYMENT_SUBSET_MAIN, 3, curBlockNumber + 99))];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('does not allow protocol upgrade to be scheduled in the past', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, curBlockNumber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, new Promise(function (resolve, reject) { return eth_1.web3.eth.getBlockNumber(function (err, blockNumber) { return err ? reject(err) : resolve(blockNumber); }); })];
                    case 2:
                        curBlockNumber = _a.sent();
                        return [4 /*yield*/, driver_1.expectRejected(d.protocol.setProtocolVersion(driver_1.DEPLOYMENT_SUBSET_MAIN, 2, curBlockNumber))];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('does not allow protocol downgrade', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, curBlockNumber, r;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, new Promise(function (resolve, reject) { return eth_1.web3.eth.getBlockNumber(function (err, blockNumber) { return err ? reject(err) : resolve(blockNumber); }); })];
                    case 2:
                        curBlockNumber = _a.sent();
                        return [4 /*yield*/, d.protocol.setProtocolVersion(driver_1.DEPLOYMENT_SUBSET_MAIN, 3, curBlockNumber + 100)];
                    case 3:
                        r = _a.sent();
                        expect(r).to.have.a.protocolChangedEvent({
                            deploymentSubset: driver_1.DEPLOYMENT_SUBSET_MAIN,
                            protocolVersion: helpers_1.bn(3),
                            asOfBlock: helpers_1.bn(curBlockNumber + 100)
                        });
                        return [4 /*yield*/, driver_1.expectRejected(d.protocol.setProtocolVersion(driver_1.DEPLOYMENT_SUBSET_MAIN, 3, curBlockNumber + 101))];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, driver_1.expectRejected(d.protocol.setProtocolVersion(driver_1.DEPLOYMENT_SUBSET_MAIN, 2, curBlockNumber + 102))];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
