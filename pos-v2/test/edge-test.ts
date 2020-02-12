import BN from "bn.js";
import {DEFAULT_MINIMUM_STAKE, DEFAULT_TOPOLOGY_SIZE, Driver, expectRejected, Participant, ZERO_ADDR} from "./driver";
import {expect, use} from "chai";
import * as _ from "lodash";
use(require('chai-bn')(BN));
use(require('./matchers'));

contract('pos-v2-edge-cases', async () => {
    it('should remove a validator with insufficient stake from committee', async() => {
        const MIN_STAKE = new BN(100);
        const d = await Driver.new(10, 15, MIN_STAKE);

        const v = d.newParticipant();
        await v.stake(MIN_STAKE);

        await v.registerAsValidator();
        let r = await v.notifyReadyForCommittee();
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
        await v2.stake(100); // required due to the delegation cap ratio

        const r = await v1.delegate(v2);
        expect(r).to.have.a.totalStakeChangedEvent({
           addr: v1.address,
           newTotal: new BN(0)
        });
        expect(r).to.have.a.totalStakeChangedEvent({
           addr: v2.address,
           newTotal: new BN(200)
        });
    });

    it('enforces effective stake limit of x-times the own stake', async () => {
        const d = await Driver.new(2, 3, 100, 10);

        const v1 = d.newParticipant();
        const v2 = d.newParticipant();

        await v1.registerAsValidator();
        await v1.notifyReadyForCommittee();

        await v2.delegate(v1);

        await v1.stake(100);

        let r = await v2.stake(900);
        expect(r).to.have.a.totalStakeChangedEvent({
           addr: v1.address,
           newTotal: new BN(1000),
        });

        r = await v2.stake(1);
        expect(r).to.have.a.totalStakeChangedEvent({
           addr: v1.address,
           newTotal: new BN(1000),
        });

        r = await v2.unstake(2);
        expect(r).to.have.a.totalStakeChangedEvent({
           addr: v1.address,
           newTotal: new BN(999),
        });

        r = await v2.stake(11);
        expect(r).to.have.a.totalStakeChangedEvent({
            addr: v1.address,
            newTotal: new BN(1000),
        });
        expect(r).to.have.a.committeeChangedEvent({
           addrs: [v1.address],
           stakes: [new BN(1000)]
        });

        r = await v1.stake(2);
        expect(r).to.have.a.totalStakeChangedEvent({
            addr: v1.address,
            newTotal: new BN(1012),
        });
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [v1.address],
            stakes: [new BN(1012)]
        });

        r = await v2.stake(30);
        expect(r).to.have.a.totalStakeChangedEvent({
            addr: v1.address,
            newTotal: new BN(1020),
        });
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [v1.address],
            stakes: [new BN(1020)]
        });

        r = await v1.stake(1);
        expect(r).to.have.a.totalStakeChangedEvent({
            addr: v1.address,
            newTotal: new BN(1030),
        });
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [v1.address],
            stakes: [new BN(1030)]
        });
    });

    it('ensures validator who delegated cannot join committee even when owning enough stake', async () => {
       const d = await Driver.new();
       const v1 = d.newParticipant();
       const v2 = d.newParticipant();

       await v1.delegate(v2);
       await v1.stake(DEFAULT_MINIMUM_STAKE);
       await v1.registerAsValidator();
       await v1.notifyReadyForCommittee();

       await v2.registerAsValidator();
       await v2.notifyReadyForCommittee();
       let r = await v2.stake(DEFAULT_MINIMUM_STAKE);

       expect(r).to.have.a.committeeChangedEvent({ // Make sure v1 does not enter the committee
           addrs: [v2.address],
       })
    });

    it('ensures a non-ready validator cannot join the committee even when owning enough stake', async() => {
        const d = await Driver.new();
        const v = d.newParticipant();
        await v.registerAsValidator();
        let r = await v.stake(DEFAULT_MINIMUM_STAKE);
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: [v.orbsAddress]
        });
        expect(r).to.not.have.a.committeeChangedEvent();

        r = await v.notifyReadyForCommittee();
        expect(r).to.have.a.committeeChangedEvent({
            orbsAddrs: [v.orbsAddress]
        })
    });

    it('publishes a CommiteeChangedEvent when the commitee becomes empty', async () => {
        const d = await Driver.new();
        const v = d.newParticipant();
        await v.registerAsValidator();
        await v.stake(DEFAULT_MINIMUM_STAKE);

        let r = await v.notifyReadyForCommittee();
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [v.address]
        });

        r = await v.unstake(DEFAULT_MINIMUM_STAKE);
        expect(r).to.have.a.committeeChangedEvent({
            addrs: []
        });
    });

    it('ignores ReadyForCommittee state when electing candidates', async () => {
        const d = await Driver.new();
        let r;

        const topology: Participant[] = await Promise.all(_.range(DEFAULT_TOPOLOGY_SIZE, 0, -1).map(async i => {
            const v = d.newParticipant();
            await v.registerAsValidator();
            await v.notifyReadyForCommittee();
            r = await v.stake(DEFAULT_MINIMUM_STAKE*i);
            return v;
        }));
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: topology.map(v => v.orbsAddress)
        });

        const newValidator = d.newParticipant();
        await newValidator.registerAsValidator();
        r = await newValidator.stake(DEFAULT_MINIMUM_STAKE*2);
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: topology.slice(0, DEFAULT_TOPOLOGY_SIZE - 1).map(v => v.orbsAddress).concat(newValidator.orbsAddress)
        });

        const newValidator2 = d.newParticipant();
        await newValidator2.registerAsValidator();
        await newValidator2.notifyReadyForCommittee();
        r = await newValidator2.stake(DEFAULT_MINIMUM_STAKE);
        expect(r).to.not.have.a.topologyChangedEvent();
    })
});
