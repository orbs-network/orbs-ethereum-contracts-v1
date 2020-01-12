const BN = require('bn.js');
const chai = require('chai');
chai.use(require('chai-bn')(BN));

const {Driver, expectBNArrayEqual, expectRejected, ZERO_ADDR} = require("./driver");

const expect = chai.expect;

contract('pos-v2-edge-cases', async () => {
    it('does not elect without registration', async() => {
        const d = await Driver.new();

        const V1_STAKE = 100;

        const v1 = d.newValidator();
        const r1 = await v1.stake(V1_STAKE);

        expect(d.committeeChangedEvents(r1)).to.be.length(0);
    });

    it('a validator should not be able to register twice', async() => {
        const d = await Driver.new();

        // Validator registers

        const v1 = d.newValidator();
        const r1 = await d.pos.registerValidator(v1.ip, {from: v1.address});

        const rl = d.validatorRegisteredEvents(r1)[0];
        expect(rl.addr).to.equal(v1.address);
        expect(rl.ip).to.equal(v1.ip);

        const cl = d.committeeChangedEvents(r1)[0];
        expect(cl.addrs).to.eql([v1.address]);
        expectBNArrayEqual(cl.stakes, [0]);

        // The first validator attempts to register again - should not emit events
        await expectRejected(d.pos.registerValidator(v1.ip, {from: v1.address}));
    });

    it('should only accept stake notifications from the staking contract', async () => {
        const d = await Driver.new();

        await expectRejected(d.pos.setStakingContract(d.contractsNonOwner, {from: d.contractsNonOwner}), "only owner should be able to set the staking contract");
        await expectRejected(d.pos.setStakingContract(ZERO_ADDR, {from: d.contractsOwner}), "staking contract should not be zero");

        const stakingAddr = d.accounts[1];
        const nonStakingAddr = d.accounts[2];
        await d.pos.setStakingContract(stakingAddr, {from: d.contractsOwner});

        await expectRejected(d.pos.staked(d.accounts[0], 1, 1, {from: nonStakingAddr}), "should not accept notifications from an address other than the staking contract");
        await expectRejected(d.pos.unstaked(d.accounts[0], 1, 1, {from: nonStakingAddr}), "should not accept notifications from an address other than the staking contract");

        await d.pos.staked(d.accounts[0], 1, 1, {from: stakingAddr});
        await d.pos.unstaked(d.accounts[0], 1, 1, {from: stakingAddr});
    })
});
