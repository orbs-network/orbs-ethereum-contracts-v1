import BN from "bn.js";
import {Driver, expectRejected, ZERO_ADDR} from "./driver";
import chai from "chai";
chai.use(require('chai-bn')(BN));
chai.use(require('./matchers'));

const expect = chai.expect;

contract('pos-v2-edge-cases', async () => {
    it('should remove a validator with insufficient stake from committee', async() => {
        const MIN_STAKE = new BN(100);
        const d = await Driver.new(10, 15, MIN_STAKE);

        const v = d.newParticipant();
        await v.stake(MIN_STAKE);
        let r = await v.registerAsValidator();
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [v.address],
            stakes: [MIN_STAKE]
        });

        const unstakeAmount = MIN_STAKE.div(new BN(4));
        r = await v.unstake(unstakeAmount);
        expect(r).to.have.a.unstakedEvent({
            stakeOwner: v.address,
            amount: unstakeAmount,
            totalStakedAmount: MIN_STAKE.sub(unstakeAmount)
        });
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [],
            stakes: []
        })
    });

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
        await v.stake(100);
        const r = await d.elections.registerValidator(v.ip, v.orbsAddress, {from: v.address});
        expect(r).to.have.a.validatorRegisteredEvent({
            addr: v.address,
            ip: v.ip
        });
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [v.address],
            stakes: [new BN(100)]
        });

        // The first validator attempts to register again - should not emit events
        await expectRejected(d.elections.registerValidator(v.ip, v.orbsAddress,{from: v.address}));
    });

    it('should only accept stake notifications from the staking contract', async () => {
        const d = await Driver.new();

        await expectRejected(d.elections.setStakingContract(d.contractsNonOwner, {from: d.contractsNonOwner}), "only owner should be able to set the staking contract");
        await expectRejected(d.elections.setStakingContract(ZERO_ADDR, {from: d.contractsOwner}), "staking contract should not be zero");

        const stakingAddr = d.accounts[1];
        const nonStakingAddr = d.accounts[2];
        await d.elections.setStakingContract(stakingAddr, {from: d.contractsOwner});

        await expectRejected(d.elections.staked(d.accounts[0], 1, {from: nonStakingAddr}), "should not accept notifications from an address other than the staking contract");
        await expectRejected(d.elections.unstaked(d.accounts[0], 1, {from: nonStakingAddr}), "should not accept notifications from an address other than the staking contract");

        await d.elections.staked(d.accounts[0], 1, {from: stakingAddr});
        await d.elections.unstaked(d.accounts[0], 1, {from: stakingAddr});
    });

    it('staking before or after delegating has the same effect', async () => {
        const d = await Driver.new();

        const firstValidator = d.newParticipant();
        let r = await firstValidator.stake(100);

        // stake before delegate
        const delegator = d.newParticipant();
        await delegator.stake(100);
        r = await delegator.delegate(firstValidator);

        expect(r).to.have.a.totalStakeChangedEvent({addr: firstValidator.address, newTotal: new BN(200)});

        // delegate before stake
        const delegator1 = d.newParticipant();
        await delegator1.delegate(firstValidator);
        r = await delegator1.stake(100);

        expect(r).to.have.a.totalStakeChangedEvent({addr: firstValidator.address, newTotal: new BN(300)});
    });

    it('registers subsciber only by owner', async () => {
        const d = await Driver.new();
        const subscriber = await artifacts.require('MonthlySubscriptionPlan').new(d.subscriptions.address, d.erc20.address, 'tier', 1);

        await expectRejected(d.subscriptions.addSubscriber(subscriber.address, {from: d.contractsNonOwner}), "Non-owner should not be able to add a subscriber");
        await d.subscriptions.addSubscriber(subscriber.address, {from: d.contractsOwner});
    });

    it('should not add a subscriber with a zero address', async () => {
        const d = await Driver.new();
        await expectRejected(d.subscriptions.addSubscriber(ZERO_ADDR, {from: d.contractsOwner}), "Should not deploy a subscriber with a zero address");
    });

    it('does not count delegated stake twice', async () => {
       const d = await Driver.new();

       const v1 = d.newParticipant();
       const v2 = d.newParticipant();

       await v1.stake(100);
       let r = await v1.delegate(v2);
       expect(r).to.have.a.totalStakeChangedEvent({
           addr: v1.address,
           newTotal: new BN(0)
       });
       expect(r).to.have.a.totalStakeChangedEvent({
           addr: v2.address,
           newTotal: new BN(100)
       });

    })
});
