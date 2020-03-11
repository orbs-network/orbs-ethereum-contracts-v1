"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var web3_1 = __importDefault(require("web3"));
var compiled_contracts_1 = require("./compiled-contracts");
var bn_js_1 = __importDefault(require("bn.js"));
var HDWalletProvider = require("truffle-hdwallet-provider");
exports.ETHEREUM_URL = process.env.ETHEREUM_URL || "http://localhost:7545";
var ETHEREUM_MNEMONIC = process.env.ETHEREUM_MNEMONIC || "vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid";
var refreshWeb3 = function () {
    exports.web3 = new web3_1.default(new HDWalletProvider(ETHEREUM_MNEMONIC, exports.ETHEREUM_URL, 0, 100, false));
};
refreshWeb3();
var Contract = /** @class */ (function () {
    function Contract(abi, web3Contract) {
        var _this = this;
        this.abi = abi;
        this.web3Contract = web3Contract;
        Object.keys(web3Contract.methods)
            .filter(function (x) { return x[0] != '0'; })
            .forEach(function (m) {
            _this[m] = function () {
                return this.callContractMethod(m, abi.find(function (x) { return x.name == m; }), Array.from(arguments));
            };
            _this[m].bind(_this);
        });
    }
    Object.defineProperty(Contract.prototype, "address", {
        get: function () {
            return this.web3Contract.options.address;
        },
        enumerable: true,
        configurable: true
    });
    Contract.prototype.recreateWeb3Contract = function () {
        refreshWeb3();
        this.web3Contract = new exports.web3.eth.Contract(this.abi, this.address);
    };
    Contract.prototype.callContractMethod = function (method, methodAbi, args) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, opts, action, ret, e_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, exports.web3.eth.getAccounts()];
                    case 1:
                        accounts = _b.sent();
                        opts = {};
                        if (args.length > 0 && JSON.stringify(args[args.length - 1])[0] == '{') {
                            opts = args.pop();
                        }
                        args = args.map(function (x) { return bn_js_1.default.isBN(x) ? x.toString() : Array.isArray(x) ? x.map(function (_x) { return bn_js_1.default.isBN(_x) ? _x.toString() : _x; }) : x; });
                        action = methodAbi.stateMutability == "view" ? "call" : "send";
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, (_a = this.web3Contract.methods)[method].apply(_a, args)[action](__assign({ from: accounts[0], gas: 6700000 }, opts))];
                    case 3:
                        ret = _b.sent();
                        return [2 /*return*/, ret];
                    case 4:
                        e_1 = _b.sent();
                        this.recreateWeb3Contract();
                        throw e_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return Contract;
}());
exports.Contract = Contract;
function deploy(contractName, args, options) {
    return __awaiter(this, void 0, void 0, function () {
        var accounts, abi, web3Contract, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.web3.eth.getAccounts()];
                case 1:
                    accounts = _a.sent();
                    abi = compiled_contracts_1.compiledContracts[contractName].abi;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (new exports.web3.eth.Contract(abi).deploy({
                            data: compiled_contracts_1.compiledContracts[contractName].bytecode,
                            arguments: args || []
                        }).send(__assign({ from: accounts[0] }, (options || {}))))];
                case 3:
                    web3Contract = _a.sent();
                    return [2 /*return*/, new Contract(abi, web3Contract)];
                case 4:
                    e_2 = _a.sent();
                    refreshWeb3();
                    throw e_2;
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.deploy = deploy;
