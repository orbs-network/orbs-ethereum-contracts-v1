import Web3 from "web3";
declare const web3: Web3;

const elections = artifacts.require("Elections");
const staking = artifacts.require("StakingContract");
const subscriptions = artifacts.require("Subscriptions");
const rewards = artifacts.require("Rewards");

function parseLogs(txResult, contract, eventSignature) {

    const inputs = contract.abi.find(e => e.name == eventSignature.split('(')[0]).inputs;

    const eventSignatureHash = web3.eth.abi.encodeEventSignature(eventSignature);
    return txResult.receipt.rawLogs
        .filter(rl => rl.topics[0] === eventSignatureHash)
        .map(rawLog => web3.eth.abi.decodeLog(inputs, rawLog.data, rawLog.topics.slice(1) /*assume all events are non-anonymous*/));
}

export const committeeChangedEvents = (txResult) => parseLogs(txResult, elections, "CommitteeChanged(address[],address[],uint256[])");
export const validatorRegisteredEvents = (txResult) => parseLogs(txResult, elections, "ValidatorRegistered(address,bytes4)");
export const stakedEvents = (txResult) => parseLogs(txResult, staking, "Staked(address,uint256,uint256)");
export const unstakedEvents = (txResult) => parseLogs(txResult, staking, "Unstaked(address,uint256,uint256)");
export const delegatedEvents = (txResult) => parseLogs(txResult, elections, "Delegated(address,address)");
export const totalStakeChangedEvents = (txResult) => parseLogs(txResult, elections, "TotalStakeChanged(address,uint256)");
export const subscriptionChangedEvents = (txResult) => parseLogs(txResult, subscriptions, "SubscriptionChanged(uint256,uint256,uint256,string)");
export const paymentEvents = (txResult) => parseLogs(txResult, subscriptions, "Payment(uint256,address,uint256,string,uint256)");
export const feeAddedToBucketEvents = (txResult) => parseLogs(txResult, rewards, "FeeAddedToBucket(uint256,uint256,uint256)");
export const rewardAssignedEvents = (txResult) => parseLogs(txResult, rewards, "RewardAssigned(address,uint256,uint256)");
export const topologyChangedEvents = (txResult) => parseLogs(txResult, elections, "TopologyChanged(address[],bytes4[])");