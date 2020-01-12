const {expectBNArrayEqual} = require("./driver");

const pos = artifacts.require("PosV2");
const erc20 = artifacts.require('TestingERC20');
const staking = artifacts.require("StakingContract");

function _parseLogs(txResult, inputs, eventSignature) {
    const eventSignatureHash = web3.eth.abi.encodeEventSignature(eventSignature);
    return txResult.receipt.rawLogs
        .filter(rl => rl.topics[0] === eventSignatureHash)
        .map(rawLog => web3.eth.abi.decodeLog(inputs, rawLog.data, rawLog.topics.slice(1) /*assume all events are non-anonymous*/));
}

const BN = require('bn.js');


function compare(a, b) {
    if (BN.isBN(a) || BN.isBN(b)) {
        return new BN(a).eq(new BN(b));
    } else {
        if (Array.isArray(a) && BN.isBN(a[0]) || Array.isArray(b) && BN.isBN(b[0])) {
            expectBNArrayEqual(a, b);
            return true;
        }
        expect(a).to.deep.equal(b);
        return true;
    }
}

const containEvent = (eventName, eventSig, contract) => function(_super) {
    return function (data) {
        data = data || {};

        const inputs = contract.abi.find(e => e.name == eventName).inputs;
        const eventSignature = eventSig;

        const txResult = this._obj;
        const log = _parseLogs(txResult, inputs, eventSignature).pop();

        this.assert(log != null, "expected the event to exist", "expected no event to exist");

        for (const k in data) {
            this.assert(
                compare(data[k], log[k])
                , "expected #{this} to be #{exp} but got #{act}"
                , "expected #{this} to not be #{act}"
                , data[k]    // expected
                , log[k]   // actual
            );
        }
    }
};

module.exports = function (chai, utils) {
    chai.Assertion.overwriteMethod('delegatedEvent', containEvent('Delegated', 'Delegated(address,address)', pos));
    chai.Assertion.overwriteMethod('validatorRegisteredEvent', containEvent('ValidatorRegistered', 'ValidatorRegistered(address,bytes4)', pos));
    chai.Assertion.overwriteMethod('committeeChangedEvent', containEvent('CommitteeChanged', 'CommitteeChanged(address[],uint256[])', pos));
    chai.Assertion.overwriteMethod('stakedEvent', containEvent('Staked', 'Staked(address,uint256,uint256)', staking));
};
