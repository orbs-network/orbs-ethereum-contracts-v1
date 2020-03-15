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
var child_process_1 = require("child_process");
var eth_1 = require("../eth");
var node_fetch_1 = __importDefault(require("node-fetch"));
var ts_retry_promise_1 = require("ts-retry-promise");
var bn_js_1 = __importDefault(require("bn.js"));
var driver_1 = require("./driver");
var driver_2 = require("./driver");
exports.Driver = driver_2.Driver;
function createVC(d) {
    return __awaiter(this, void 0, void 0, function () {
        var monthlyRate, firstPayment, subscriber, appOwner;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    monthlyRate = new bn_js_1.default(1000);
                    firstPayment = monthlyRate.mul(new bn_js_1.default(2));
                    return [4 /*yield*/, d.newSubscriber('defaultTier', monthlyRate)];
                case 1:
                    subscriber = _a.sent();
                    appOwner = d.newParticipant();
                    return [4 /*yield*/, d.erc20.assign(appOwner.address, firstPayment)];
                case 2:
                    _a.sent(); // TODO extract assign+approve to driver in two places
                    return [4 /*yield*/, d.erc20.approve(subscriber.address, firstPayment, {
                            from: appOwner.address
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/, subscriber.createVC(firstPayment, driver_1.DEPLOYMENT_SUBSET_MAIN, {
                            from: appOwner.address
                        })];
            }
        });
    });
}
exports.createVC = createVC;
exports.ganache = {
    process: null,
    startGanache: function () {
        return __awaiter(this, void 0, void 0, function () {
            var process;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (exports.ganache.process) {
                            throw new Error("ganache-cli process already running! PID=" + exports.ganache.process.pid);
                        }
                        process = child_process_1.spawn('ganache-cli', [
                            '-p',
                            '7545',
                            '-i',
                            '5777',
                            '-a',
                            '100',
                            '-m',
                            'vanish junk genuine web seminar cook absurd royal ability series taste method identify elevator liquid'
                        ], { stdio: 'pipe' });
                        exports.ganache.process = process;
                        return [4 /*yield*/, ts_retry_promise_1.retry(function () {
                                return node_fetch_1.default(eth_1.ETHEREUM_URL, {
                                    method: 'POST',
                                    body: JSON.stringify({ jsonrpc: '2.0', method: 'web3_clientVersion', params: [], id: 67 })
                                });
                            }, { retries: 10, delay: 300 })];
                    case 1:
                        _a.sent();
                        console.log('Ganache is up');
                        return [2 /*return*/];
                }
            });
        });
    },
    stopGanache: function () {
        if (exports.ganache.process) {
            console.log('Ganache goes down');
            exports.ganache.process.kill('SIGINT');
        }
    }
};
