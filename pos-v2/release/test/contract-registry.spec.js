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
chai_1.default.use(require('chai-bn')(bn_js_1.default));
chai_1.default.use(require('./matchers'));
var expect = chai_1.default.expect;
describe('contract-registry-high-level-flows', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        it('registers contracts only by governor and emits events', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, governor, registry, contract1Name, addr1, r, _a, addr2, _b, nonGovernor, contract2Name, addr3, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _d.sent();
                        governor = d.newParticipant();
                        return [4 /*yield*/, driver_1.Driver.newContractRegistry(governor.address)];
                    case 2:
                        registry = _d.sent();
                        contract1Name = "Contract1";
                        addr1 = d.newParticipant().address;
                        return [4 /*yield*/, registry.set(contract1Name, addr1, { from: governor.address })];
                    case 3:
                        r = _d.sent();
                        expect(r).to.have.a.contractAddressUpdatedEvent({
                            contractName: contract1Name,
                            addr: addr1
                        });
                        // get
                        _a = expect;
                        return [4 /*yield*/, registry.get(contract1Name)];
                    case 4:
                        // get
                        _a.apply(void 0, [_d.sent()]).to.equal(addr1);
                        addr2 = d.newParticipant().address;
                        return [4 /*yield*/, registry.set(contract1Name, addr2, { from: governor.address })];
                    case 5:
                        r = _d.sent();
                        expect(r).to.have.a.contractAddressUpdatedEvent({
                            contractName: contract1Name,
                            addr: addr2
                        });
                        // get the updated address
                        _b = expect;
                        return [4 /*yield*/, registry.get(contract1Name)];
                    case 6:
                        // get the updated address
                        _b.apply(void 0, [_d.sent()]).to.equal(addr2);
                        nonGovernor = d.newParticipant();
                        contract2Name = "Contract2";
                        addr3 = d.newParticipant().address;
                        return [4 /*yield*/, driver_1.expectRejected(registry.set(contract2Name, addr3, { from: nonGovernor.address }))];
                    case 7:
                        _d.sent();
                        return [4 /*yield*/, registry.set(contract2Name, addr3, { from: governor.address })];
                    case 8:
                        // now by governor
                        r = _d.sent();
                        expect(r).to.have.a.contractAddressUpdatedEvent({
                            contractName: contract2Name,
                            addr: addr3
                        });
                        _c = expect;
                        return [4 /*yield*/, registry.get(contract2Name)];
                    case 9:
                        _c.apply(void 0, [_d.sent()]).to.equal(addr3);
                        return [2 /*return*/];
                }
            });
        }); });
        it('allows only the contract owner to update the address of the contract registry', function () { return __awaiter(void 0, void 0, void 0, function () {
            var d, subscriber, newAddr, nonOwner;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, driver_1.Driver.new()];
                    case 1:
                        d = _a.sent();
                        return [4 /*yield*/, d.newSubscriber("tier", 1)];
                    case 2:
                        subscriber = _a.sent();
                        newAddr = d.newParticipant().address;
                        nonOwner = d.newParticipant();
                        return [4 /*yield*/, driver_1.expectRejected(d.elections.setContractRegistry(newAddr, { from: nonOwner.address }))];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, driver_1.expectRejected(d.rewards.setContractRegistry(newAddr, { from: nonOwner.address }))];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, driver_1.expectRejected(d.subscriptions.setContractRegistry(newAddr, { from: nonOwner.address }))];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, driver_1.expectRejected(subscriber.setContractRegistry(newAddr, { from: nonOwner.address }))];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, d.elections.setContractRegistry(newAddr)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, d.rewards.setContractRegistry(newAddr)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, d.subscriptions.setContractRegistry(newAddr)];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, subscriber.setContractRegistry(newAddr)];
                    case 10:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
