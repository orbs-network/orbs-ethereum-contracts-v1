import Web3 from "web3";
import * as _ from "lodash";
import {SubscriptionChangedEvent} from "../typings/subscriptions-contract";
import {compiledContracts} from "../compiled-contracts";

const elections = compiledContracts["Elections"];
const staking = compiledContracts["StakingContract"];
const subscriptions = compiledContracts["Subscriptions"];
const rewards = compiledContracts["Rewards"];
const protocol = compiledContracts["Protocol"];
const contractRegistry = compiledContracts["ContractRegistry"];

function parseLogs(txResult, contract, eventSignature) {
    const abi = new Web3().eth.abi;
    const inputs = contract.abi.find(e => e.name == eventSignature.split('(')[0]).inputs;
    const eventSignatureHash = abi.encodeEventSignature(eventSignature);
    return _.values(txResult.events)
        .reduce((x,y) => x.concat(y), [])
        .map(e => e.raw)
        .filter(e => e.topics[0] === eventSignatureHash)
        .map(e => abi.decodeLog(inputs, e.data, e.topics.slice(1) /*assume all events are non-anonymous*/));
}

export const committeeChangedEvents = (txResult) => parseLogs(txResult, elections, "CommitteeChanged(address[],address[],uint256[])");
export const validatorRegisteredEvents = (txResult) => parseLogs(txResult, elections, "ValidatorRegistered(address,bytes4,address)");
export const stakedEvents = (txResult) => parseLogs(txResult, staking, "Staked(address,uint256,uint256)");
export const unstakedEvents = (txResult) => parseLogs(txResult, staking, "Unstaked(address,uint256,uint256)");
export const delegatedEvents = (txResult) => parseLogs(txResult, elections, "Delegated(address,address)");
export const stakeChangedEvents = (txResult) => parseLogs(txResult, elections, "StakeChanged(address,uint256,uint256,uint256,uint256,uint256)");
export const subscriptionChangedEvents = (txResult): SubscriptionChangedEvent[] => parseLogs(txResult, subscriptions, "SubscriptionChanged(uint256,uint256,uint256,string,string)");
export const paymentEvents = (txResult) => parseLogs(txResult, subscriptions, "Payment(uint256,address,uint256,string,uint256)");
export const feeAddedToBucketEvents = (txResult) => parseLogs(txResult, rewards, "FeeAddedToBucket(uint256,uint256,uint256)");
export const rewardAssignedEvents = (txResult) => parseLogs(txResult, rewards, "RewardAssigned(address,uint256,uint256)");
export const topologyChangedEvents = (txResult) => parseLogs(txResult, elections, "TopologyChanged(address[],bytes4[])");
export const voteOutEvents = (txResult) => parseLogs(txResult, elections, "VoteOut(address,address)");
export const votedOutOfCommitteeEvents = (txResult) => parseLogs(txResult, elections, "VotedOutOfCommittee(address)");
export const vcConfigRecordChangedEvents = (txResult) => parseLogs(txResult, subscriptions, "VcConfigRecordChanged(uint256,string,string)");
export const vcOwnerChangedEvents = (txResult) => parseLogs(txResult, subscriptions, "VcOwnerChanged(uint256,address,address)");
export const vcCreatedEvents = (txResult) => parseLogs(txResult, subscriptions, "VcCreated(uint256,address)");
export const contractAddressUpdatedEvents = (txResult) => parseLogs(txResult, contractRegistry, "ContractAddressUpdated(string,address)");
export const protocolChangedEvents = (txResult) => parseLogs(txResult, protocol, "ProtocolVersionChanged(string,uint256,uint256)");
export const banningVoteEvents = (txResult) => parseLogs(txResult, elections, "BanningVote(address,address[])");
export const electionsBanned = (txResult) => parseLogs(txResult, elections, "Banned(address)");
export const electionsUnbanned = (txResult) => parseLogs(txResult, elections, "Unbanned(address)");
export const electionsDebugEvents = (txResult) => parseLogs(txResult, elections, "Debug(string,uint256)");
