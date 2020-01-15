const pos = artifacts.require("PosV2");
const erc20 = artifacts.require('TestingERC20');
const staking = artifacts.require("StakingContract");
const subscriptions = artifacts.require("Subscriptions");

function parseLogs(txResult, inputs, eventSignature) {
    const eventSignatureHash = web3.eth.abi.encodeEventSignature(eventSignature);
    return txResult.receipt.rawLogs
        .filter(rl => rl.topics[0] === eventSignatureHash)
        .map(rawLog => web3.eth.abi.decodeLog(inputs, rawLog.data, rawLog.topics.slice(1) /*assume all events are non-anonymous*/));
}

function committeeChangedEvents(txResult) {
    const inputs = pos.abi.find(e => e.name == "CommitteeChanged").inputs;
    const eventSignature = "CommitteeChanged(address[],uint256[])";

    return parseLogs(txResult, inputs, eventSignature)
}

function validatorRegisteredEvents(txResult) {
    const inputs = pos.abi.find(e => e.name == "ValidatorRegistered").inputs;
    const eventSignature = "ValidatorRegistered(address,bytes4)";

    return parseLogs(txResult, inputs, eventSignature)
}

function stakedEvents(txResult) {
    const inputs = staking.abi.find(e => e.name == "Staked").inputs;
    const eventSignature = "Staked(address,uint256,uint256)";

    return parseLogs(txResult, inputs, eventSignature)
}

function subscriptionChangedEvent(txResult) {
    const inputs = subscriptions.abi.find(e => e.name == "SubscriptionChanged").inputs;
    const eventSignature = "SubscriptionChanged(uint256,uint256,uint256,string)";

    return parseLogs(txResult, inputs, eventSignature);
}

function paymentEvent(txResult) {
    const inputs = subscriptions.abi.find(e => e.name == "Payment").inputs;
    const eventSignature = "Payment(uint256,address,uint256,string,uint256)";

    return parseLogs(txResult, inputs, eventSignature);
}

function delegatedEvents(txResult) {
    const inputs = pos.abi.find(e => e.name == "Delegated").inputs;
    const eventSignature = "Delegated(address,address)";

    return parseLogs(txResult, inputs, eventSignature)
}

function totalStakeChangedEvents(txResult) {
    const inputs = pos.abi.find(e => e.name == "TotalStakeChanged").inputs;
    const eventSignature = "TotalStakeChanged(address,uint256)";

    return parseLogs(txResult, inputs, eventSignature)
}

module.exports = {
    committeeChangedEvents,
    validatorRegisteredEvents,
    stakedEvents,
    delegatedEvents,
    totalStakeChangedEvents,
    subscriptionChangedEvent,
    paymentEvent,
};