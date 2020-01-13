const BN = require('bn.js');
const chai = require('chai');
chai.use(require('chai-bn')(BN));

const {Driver, expectBNArrayEqual, expectRejected, ZERO_ADDR} = require("./driver");

const expect = chai.expect;

contract('pos-v2-edge-cases', async () => {
    it('does not elect without registration', async() => {
        const d = await Driver.new();

        const V1_STAKE = 100;

        const v = d.newParticipant();
        const r = await v.stake(V1_STAKE);
        expect(r).to.not.have.a.committeeChangedEvent();
    });

    it('a validator should not be able to register twice', async() => {
        const d = await Driver.new();

        // Validator registers

        const v = d.newParticipant();
        const r = await d.pos.registerValidator(v.ip, {from: v.address});
        expect(r).to.have.a.validatorRegisteredEvent({
            addr: v.address,
            ip: v.ip
        });
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [v.address],
            stakes: [new BN(0)]
        });

        // The first validator attempts to register again - should not emit events
        await expectRejected(d.pos.registerValidator(v.ip, {from: v.address}));
    });

    it('should only accept stake notifications from the staking contract', async () => {
        const d = await Driver.new();

        await expectRejected(d.pos.setStakingContract(d.contractsNonOwner, {from: d.contractsNonOwner}), "only owner should be able to set the staking contract");
        await expectRejected(d.pos.setStakingContract(ZERO_ADDR, {from: d.contractsOwner}), "staking contract should not be zero");

        const stakingAddr = d.accounts[1];
        const nonStakingAddr = d.accounts[2];
        await d.pos.setStakingContract(stakingAddr, {from: d.contractsOwner});

        await expectRejected(d.pos.staked(d.accounts[0], 1, {from: nonStakingAddr}), "should not accept notifications from an address other than the staking contract");
        await expectRejected(d.pos.unstaked(d.accounts[0], 1, {from: nonStakingAddr}), "should not accept notifications from an address other than the staking contract");

        await d.pos.staked(d.accounts[0], 1, {from: stakingAddr});
        await d.pos.unstaked(d.accounts[0], 1, {from: stakingAddr});
    });

    it('staking before or after delegating has the same effect', async () => {
        const d = await Driver.new();

        const firstValidator = d.newParticipant();
        let r = await firstValidator.stake(100);

        // stake before delegate
        const delegator = d.newParticipant();
        await delegator.stake(100);
        r = await delegator.delegate(firstValidator);

        expect(r).to.have.a.totalStakeChangedEvent({addr: firstValidator.address, newTotal: '200'});

        // delegate before stake
        const delegator1 = d.newParticipant();
        await delegator1.delegate(firstValidator);
        r = await delegator1.stake(100);

        expect(r).to.have.a.totalStakeChangedEvent({addr: firstValidator.address, newTotal: '300'});
    })
});
