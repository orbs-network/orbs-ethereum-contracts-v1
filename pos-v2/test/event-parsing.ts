import Web3 from "web3";
import {SubscriptionChangedEvent} from "../typings/subscriptions-contract";
declare const web3: Web3;

const elections = artifacts.require("Elections");
const staking = artifacts.require("StakingContract");
const subscriptions = artifacts.require("Subscriptions");
const rewards = artifacts.require("Rewards");
const contractRegistry = artifacts.require("ContractRegistry");

function parseLogs(txResult, contract, eventSignature) {
    const inputs = contract.abi.find(e => e.name == eventSignature.split('(')[0]).inputs;
    const eventSignatureHash = web3.eth.abi.encodeEventSignature(eventSignature);
    return txResult.receipt.rawLogs
        .filter(rl => rl.topics[0] === eventSignatureHash)
        .map(rawLog => web3.eth.abi.decodeLog(inputs, rawLog.data, rawLog.topics.slice(1) /*assume all events are non-anonymous*/));
}

export const committeeChangedEvents = (txResult) => parseLogs(txResult, elections, "CommitteeChanged(address[],address[],uint256[])");
export const validatorRegisteredEvents = (txResult) => parseLogs(txResult, elections, "ValidatorRegistered(address,bytes4,address)");
export const stakedEvents = (txResult) => parseLogs(txResult, staking, "Staked(address,uint256,uint256)");
export const unstakedEvents = (txResult) => parseLogs(txResult, staking, "Unstaked(address,uint256,uint256)");
export const delegatedEvents = (txResult) => parseLogs(txResult, elections, "Delegated(address,address)");
export const stakeChangedEvents = (txResult) => parseLogs(txResult, elections, "StakeChanged(address,uint256,uint256,uint256,uint256)");
export const subscriptionChangedEvents = (txResult): SubscriptionChangedEvent[] => parseLogs(txResult, subscriptions, "SubscriptionChanged(uint256,uint256,uint256,string)");
export const paymentEvents = (txResult) => parseLogs(txResult, subscriptions, "Payment(uint256,address,uint256,string,uint256)");
export const feeAddedToBucketEvents = (txResult) => parseLogs(txResult, rewards, "FeeAddedToBucket(uint256,uint256,uint256)");
export const rewardAssignedEvents = (txResult) => parseLogs(txResult, rewards, "RewardAssigned(address,uint256,uint256)");
export const topologyChangedEvents = (txResult) => parseLogs(txResult, elections, "TopologyChanged(address[],bytes4[])");
export const voteOutEvents = (txResult) => parseLogs(txResult, elections, "VoteOut(address,address)");
export const votedOutOfCommitteeEvents = (txResult) => parseLogs(txResult, elections, "VotedOutOfCommittee(address)");
export const vcConfigRecordChangedEvents = (txResult) => parseLogs(txResult, subscriptions, "VcConfigRecordChanged(uint256,string,string)");
export const contractAddressUpdatedEvents = (txResult) => parseLogs(txResult, contractRegistry, "ContractAddressUpdated(string,address)");
export const banningVoteEvents = (txResult) => parseLogs(txResult, elections, "BanningVote(address,address[])");
export const electionsDebugEvents = (txResult) => parseLogs(txResult, elections, "Debug(string,uint256)");