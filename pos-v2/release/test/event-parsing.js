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
var web3_1 = __importDefault(require("web3"));
var _ = __importStar(require("lodash"));
var compiled_contracts_1 = require("../compiled-contracts");
var elections = compiled_contracts_1.compiledContracts["Elections"];
var staking = compiled_contracts_1.compiledContracts["StakingContract"];
var subscriptions = compiled_contracts_1.compiledContracts["Subscriptions"];
var rewards = compiled_contracts_1.compiledContracts["Rewards"];
var protocol = compiled_contracts_1.compiledContracts["Protocol"];
var contractRegistry = compiled_contracts_1.compiledContracts["ContractRegistry"];
function parseLogs(txResult, contract, eventSignature) {
    var abi = new web3_1.default().eth.abi;
    var inputs = contract.abi.find(function (e) { return e.name == eventSignature.split('(')[0]; }).inputs;
    var eventSignatureHash = abi.encodeEventSignature(eventSignature);
    return _.values(txResult.events)
        .reduce(function (x, y) { return x.concat(y); }, [])
        .map(function (e) { return e.raw; })
        .filter(function (e) { return e.topics[0] === eventSignatureHash; })
        .map(function (e) { return abi.decodeLog(inputs, e.data, e.topics.slice(1) /*assume all events are non-anonymous*/); });
}
exports.committeeChangedEvents = function (txResult) { return parseLogs(txResult, elections, "CommitteeChanged(address[],address[],uint256[])"); };
exports.validatorRegisteredEvents = function (txResult) { return parseLogs(txResult, elections, "ValidatorRegistered(address,bytes4,address)"); };
exports.stakedEvents = function (txResult) { return parseLogs(txResult, staking, "Staked(address,uint256,uint256)"); };
exports.unstakedEvents = function (txResult) { return parseLogs(txResult, staking, "Unstaked(address,uint256,uint256)"); };
exports.delegatedEvents = function (txResult) { return parseLogs(txResult, elections, "Delegated(address,address)"); };
exports.stakeChangedEvents = function (txResult) { return parseLogs(txResult, elections, "StakeChanged(address,uint256,uint256,uint256,uint256,uint256)"); };
exports.subscriptionChangedEvents = function (txResult) { return parseLogs(txResult, subscriptions, "SubscriptionChanged(uint256,uint256,uint256,string,string)"); };
exports.paymentEvents = function (txResult) { return parseLogs(txResult, subscriptions, "Payment(uint256,address,uint256,string,uint256)"); };
exports.feeAddedToBucketEvents = function (txResult) { return parseLogs(txResult, rewards, "FeeAddedToBucket(uint256,uint256,uint256)"); };
exports.rewardAssignedEvents = function (txResult) { return parseLogs(txResult, rewards, "RewardAssigned(address,uint256,uint256)"); };
exports.topologyChangedEvents = function (txResult) { return parseLogs(txResult, elections, "TopologyChanged(address[],bytes4[])"); };
exports.voteOutEvents = function (txResult) { return parseLogs(txResult, elections, "VoteOut(address,address)"); };
exports.votedOutOfCommitteeEvents = function (txResult) { return parseLogs(txResult, elections, "VotedOutOfCommittee(address)"); };
exports.vcConfigRecordChangedEvents = function (txResult) { return parseLogs(txResult, subscriptions, "VcConfigRecordChanged(uint256,string,string)"); };
exports.vcOwnerChangedEvents = function (txResult) { return parseLogs(txResult, subscriptions, "VcOwnerChanged(uint256,address,address)"); };
exports.vcCreatedEvents = function (txResult) { return parseLogs(txResult, subscriptions, "VcCreated(uint256,address)"); };
exports.contractAddressUpdatedEvents = function (txResult) { return parseLogs(txResult, contractRegistry, "ContractAddressUpdated(string,address)"); };
exports.protocolChangedEvents = function (txResult) { return parseLogs(txResult, protocol, "ProtocolVersionChanged(string,uint256,uint256)"); };
exports.banningVoteEvents = function (txResult) { return parseLogs(txResult, elections, "BanningVote(address,address[])"); };
exports.electionsBanned = function (txResult) { return parseLogs(txResult, elections, "Banned(address)"); };
exports.electionsUnbanned = function (txResult) { return parseLogs(txResult, elections, "Unbanned(address)"); };
exports.electionsDebugEvents = function (txResult) { return parseLogs(txResult, elections, "Debug(string,uint256)"); };
