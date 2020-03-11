import 'mocha';

import * as _ from "lodash";
import Web3 from "web3";
declare const web3: Web3;

import BN from "bn.js";
import {
    DEFAULT_BANNING_THRESHOLD, DEFAULT_COMMITTEE_SIZE,
    DEFAULT_MINIMUM_STAKE, DEFAULT_TOPOLOGY_SIZE,
    DEFAULT_VOTE_OUT_THRESHOLD, DEFAULT_VOTE_OUT_TIMEOUT,
    BANNING_LOCK_TIMEOUT,
    Driver,
    expectRejected,
    Participant,
    ZERO_ADDR
} from "./driver";
import chai from "chai";
chai.use(require('chai-bn')(BN));
chai.use(require('./matchers'));

const expect = chai.expect;
const assert = chai.assert;

import {CommitteeProvider} from './committee-provider';
import {bn, evmIncreaseTime} from "./helpers";
import {ETHEREUM_URL} from "../eth";


describe('elections-high-level-flows', async () => {

    it('handle delegation requests', async () => {
        const d = await Driver.new();

        const d1 = await d.newParticipant();
        const d2 = await d.newParticipant();

        const r = await d1.delegate(d2);
        expect(r).to.have.a.delegatedEvent({
            from: d1.address,
            to: d2.address
        });
    });

    it('sorts committee by stake', async () => {
        const stake100 = new BN(100);
        const stake200 = new BN(200);
        const stake300 = new BN(300);
        const stake500 = new BN(500);
        const stake1000 = new BN(1000);

        const d = await Driver.new(2, 4, stake100);
        const committeeProvider = new CommitteeProvider(ETHEREUM_URL, d.elections.address);

        // First validator registers
        const validatorStaked100 = d.newParticipant();
        let r = await validatorStaked100.stake(stake100);
        expect(r).to.have.a.stakedEvent();

        r = await validatorStaked100.registerAsValidator();
        expect(r).to.have.a.validatorRegisteredEvent({
            addr: validatorStaked100.address,
            ip: validatorStaked100.ip
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: [validatorStaked100.orbsAddress],
            ips: [validatorStaked100.ip]
        });
        expect(r).to.not.have.a.committeeChangedEvent();

        r = await validatorStaked100.notifyReadyForCommittee();
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [validatorStaked100.address],
            orbsAddrs: [validatorStaked100.orbsAddress],
            stakes: [stake100],
        });

        const committeeFromAdapter = await committeeProvider.getCommitteeAsOf(r.blockNumber);
        expect(committeeFromAdapter).to.haveCommittee({
            addrs: [validatorStaked100.address.toLowerCase()],
            orbsAddrs: [validatorStaked100.orbsAddress.toLowerCase()],
            stakes: [stake100],
        });

        const validatorStaked200 = d.newParticipant();
        r = await validatorStaked200.stake(stake200);
        expect(r).to.have.a.stakeChangedEvent({addr: validatorStaked200.address, committeeStake: stake200});

        r = await validatorStaked200.registerAsValidator();
        expect(r).to.have.a.validatorRegisteredEvent({
            addr: validatorStaked200.address,
            ip: validatorStaked200.ip,
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: [validatorStaked100.orbsAddress, validatorStaked200.orbsAddress],
            ips: [validatorStaked100.ip, validatorStaked200.ip]
        });
        expect(r).to.not.have.a.committeeChangedEvent();

        r = await validatorStaked200.notifyReadyForCommittee();
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [validatorStaked200.address, validatorStaked100.address],
            orbsAddrs: [validatorStaked200.orbsAddress, validatorStaked100.orbsAddress],
            stakes: [stake200, stake100]
        });

        // A third validator registers high ranked

        const validatorStaked300 = d.newParticipant();
        r = await validatorStaked300.stake(stake300);
        expect(r).to.have.a.stakedEvent();

        r = await validatorStaked300.registerAsValidator();
        expect(r).to.have.a.validatorRegisteredEvent({
            addr: validatorStaked300.address,
            ip: validatorStaked300.ip
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: [validatorStaked200.orbsAddress, validatorStaked100.orbsAddress, validatorStaked300.orbsAddress],
            ips: [validatorStaked200.ip, validatorStaked100.ip, validatorStaked300.ip]
        });
        expect(r).to.not.have.a.committeeChangedEvent();

        r = await validatorStaked300.notifyReadyForCommittee();
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [validatorStaked300.address, validatorStaked200.address],
            orbsAddrs: [validatorStaked300.orbsAddress, validatorStaked200.orbsAddress],
            stakes: [stake300, stake200]
        });

        r = await d.delegateMoreStake(stake300, validatorStaked200);
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [validatorStaked200.address, validatorStaked300.address],
            orbsAddrs: [validatorStaked200.orbsAddress, validatorStaked300.orbsAddress],
            stakes: [stake200.add(stake300), stake300]
        });
        expect(r).to.not.have.a.topologyChangedEvent();

        r = await d.delegateMoreStake(stake500, validatorStaked100);
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [validatorStaked100.address, validatorStaked200.address],
            orbsAddrs: [validatorStaked100.orbsAddress, validatorStaked200.orbsAddress],
            stakes: [stake100.add(stake500), stake500]
        });
        expect(r).to.not.have.a.topologyChangedEvent();

        // A new validator registers, stakes and enters the topology

        const inTopologyValidator = d.newParticipant();
        r = await inTopologyValidator.stake(stake100);
        expect(r).to.have.a.stakedEvent();
        r = await inTopologyValidator.registerAsValidator();
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: [validatorStaked100.orbsAddress, validatorStaked200.orbsAddress, validatorStaked300.orbsAddress, inTopologyValidator.orbsAddress],
            ips: [validatorStaked100.ip, validatorStaked200.ip, validatorStaked300.ip, inTopologyValidator.ip],
        });
        expect(r).to.not.have.a.committeeChangedEvent();

        r = await inTopologyValidator.notifyReadyForCommittee();
        expect(r).to.not.have.a.committeeChangedEvent();

        // The bottom validator in the topology delegates more stake and switches places with the second to last
        // This does not change the committee nor the topology, so no event should be emitted
        r = await d.delegateMoreStake(201, inTopologyValidator);
        expect(r).to.not.have.a.committeeChangedEvent();
        expect(r).to.not.have.a.topologyChangedEvent();

        // make sure the order of validators really did change
        r = await d.elections.getTopology();
        expect(r).to.eql([validatorStaked100.address, validatorStaked200.address, inTopologyValidator.address, validatorStaked300.address]);

        // A new validator registers and stakes but does not enter the topology
        const outOfTopologyValidator = d.newParticipant();
        r = await outOfTopologyValidator.stake(stake100);
        expect(r).to.have.a.stakedEvent();
        r = await outOfTopologyValidator.registerAsValidator();
        expect(r).to.not.have.a.topologyChangedEvent();
        r = await outOfTopologyValidator.notifyReadyForCommittee();
        expect(r).to.not.have.a.committeeChangedEvent();

        // A new validator stakes enough to get to the top
        const validator = d.newParticipant();
        await validator.registerAsValidator();
        await validator.notifyReadyForCommittee();
        r = await validator.stake(stake1000); // now top of committee
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [validator.address, validatorStaked100.address],
            orbsAddrs: [validator.orbsAddress, validatorStaked100.orbsAddress],
            stakes: [stake1000, stake100.add(stake500)]
        });
        r = await validator.unstake(501); // now out of committee but still in topology
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [validatorStaked100.address, validatorStaked200.address],
            orbsAddrs: [validatorStaked100.orbsAddress, validatorStaked200.orbsAddress],
            stakes: [stake100.add(stake500), stake500]
        });
        expect(r).to.not.have.a.topologyChangedEvent();
    });

    it('votes out a committee member', async () => {
        assert(DEFAULT_VOTE_OUT_THRESHOLD < 98); // so each committee member will hold a positive stake
        assert(Math.floor(DEFAULT_VOTE_OUT_THRESHOLD / 2) >= 98 - DEFAULT_VOTE_OUT_THRESHOLD); // so the committee list will be ordered by stake

        const stakesPercentage = [
            Math.ceil(DEFAULT_VOTE_OUT_THRESHOLD / 2),
            Math.floor(DEFAULT_VOTE_OUT_THRESHOLD / 2),
            98 - DEFAULT_VOTE_OUT_THRESHOLD,
            1,
            1
        ];
        const committeeSize = stakesPercentage.length;
        const thresholdCrossingIndex = 1;

        const d = await Driver.new(committeeSize, committeeSize + 1);

        let r;
        const committee: Participant[] = [];
        for (const p of stakesPercentage) {
            const v = d.newParticipant();
            await v.registerAsValidator();
            await v.notifyReadyForCommittee();
            r = await v.stake(DEFAULT_MINIMUM_STAKE * p);
            committee.push(v);
        }
        expect(r).to.have.a.committeeChangedEvent({
            orbsAddrs: committee.map(v => v.orbsAddress)
        });

        // A committee member is voted out, rejoins, and voted-out again. This makes sure that once voted-out, the
        // votes are discarded and must be recast to vote-out a validator again.
        for (let i = 0; i < 2; i++) {
            // Part of the committee votes out, threshold is not yet reached
            const votedOutValidator = committee[committeeSize - 1];
            for (const v of committee.slice(0, thresholdCrossingIndex)) {
                const r = await d.elections.voteOut(votedOutValidator.address, {from: v.orbsAddress});
                expect(r).to.have.a.voteOutEvent({
                    voter: v.address,
                    against: votedOutValidator.address
                });
                expect(r).to.not.have.a.votedOutOfCommitteeEvent();
                expect(r).to.not.have.a.committeeChangedEvent();
            }

            r = await d.elections.voteOut(votedOutValidator.address, {from: committee[thresholdCrossingIndex].orbsAddress}); // Threshold is reached
            expect(r).to.have.a.voteOutEvent({
                voter: committee[thresholdCrossingIndex].address,
                against: votedOutValidator.address
            });
            expect(r).to.have.a.votedOutOfCommitteeEvent({
                addr: votedOutValidator.address
            });
            expect(r).to.have.a.committeeChangedEvent({
                addrs: committee.filter(v => v != votedOutValidator).map(v => v.address)
            });
            expect(r).to.not.have.a.topologyChangedEvent(); // should remain in topology

            // voted-out validator re-joins by notifying ready-for-committee
            r = await votedOutValidator.notifyReadyForCommittee();
            expect(r).to.have.a.committeeChangedEvent({
                addrs: committee.map(v => v.address)
            });
            expect(r).to.not.have.a.topologyChangedEvent();
        }
    });

    it('discards stale votes', async () => {
        assert(DEFAULT_VOTE_OUT_THRESHOLD > 50); // so one out of two equal committee members does not cross the threshold

        const committeeSize = 2;
        const d = await Driver.new(committeeSize, committeeSize + 1);

        let r;
        const committee: Participant[] = [];
        for (let i = 0; i < committeeSize; i++) {
            const v = d.newParticipant();
            await v.registerAsValidator();
            await v.notifyReadyForCommittee();
            r = await v.stake(DEFAULT_MINIMUM_STAKE);
            committee.push(v);
        }
        expect(r).to.have.a.committeeChangedEvent({
            orbsAddrs: committee.map(v => v.orbsAddress)
        });

        r = await d.elections.voteOut(committee[1].address, {from: committee[0].orbsAddress});
        expect(r).to.have.a.voteOutEvent({
            voter: committee[0].address,
            against: committee[1].address,
        });

        // ...*.* TiMe wArP *.*.....
        await evmIncreaseTime(DEFAULT_VOTE_OUT_TIMEOUT);

        r = await d.elections.voteOut(committee[1].address, {from: committee[1].orbsAddress}); // this should have crossed the vote-out threshold, but the previous vote had timed out
        expect(r).to.have.a.voteOutEvent({
            voter: committee[1].address,
            against: committee[1].address,
        });
        expect(r).to.not.have.a.votedOutOfCommitteeEvent();
        expect(r).to.not.have.a.committeeChangedEvent();

        // recast the stale vote-out, threshold should be reached
        r = await d.elections.voteOut(committee[1].address, {from: committee[0].orbsAddress});
        expect(r).to.have.a.voteOutEvent({
            voter: committee[0].address,
            against: committee[1].address,
        });
        expect(r).to.have.a.votedOutOfCommitteeEvent({
            addr: committee[1].address
        });
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [committee[0].address]
        });
    });

    it('should remove a validator with insufficient stake from committee', async () => {
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

    it('does not elect without registration', async () => {
        const d = await Driver.new();

        const V1_STAKE = 100;

        const v = d.newParticipant();
        const r = await v.stake(V1_STAKE);
        expect(r).to.not.have.a.committeeChangedEvent();
    });

    it('a validator should not be able to register twice', async () => {
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
        await expectRejected(d.elections.registerValidator(v.ip, v.orbsAddress, {from: v.address}));
    });

    it('should only accept stake notifications from the staking contract', async () => {
        const d = await Driver.new();

        const stakingAddr = d.accounts[1];
        const nonStakingAddr = d.accounts[2];

        await d.contractRegistry.set("staking", stakingAddr);

        await expectRejected(d.elections.stakeChange(d.accounts[0], 1, true, 1, {from: nonStakingAddr}), "should not accept notifications from an address other than the staking contract");
        await d.elections.stakeChange(d.accounts[0], 1, true, 1, {from: stakingAddr});
    });

    it('staking before or after delegating has the same effect', async () => {
        const d = await Driver.new();

        const firstValidator = d.newParticipant();
        let r = await firstValidator.stake(100);

        // stake before delegate
        const delegator = d.newParticipant();
        await delegator.stake(100);
        r = await delegator.delegate(firstValidator);

        expect(r).to.have.a.stakeChangedEvent({addr: firstValidator.address, committeeStake: new BN(200)});

        // delegate before stake
        const delegator1 = d.newParticipant();
        await delegator1.delegate(firstValidator);
        r = await delegator1.stake(100);

        expect(r).to.have.a.stakeChangedEvent({addr: firstValidator.address, committeeStake: new BN(300)});
    });

    it('does not count delegated stake twice', async () => {
        const d = await Driver.new();

        const v1 = d.newParticipant();
        const v2 = d.newParticipant();

        await v1.stake(100);
        await v2.stake(100); // required due to the delegation cap ratio

        const r = await v1.delegate(v2);
        expect(r).to.have.a.stakeChangedEvent({
            addr: v1.address,
            committeeStake: new BN(0)
        });
        expect(r).to.have.a.stakeChangedEvent({
            addr: v2.address,
            committeeStake: new BN(200)
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
        expect(r).to.have.a.stakeChangedEvent({
            addr: v1.address,
            committeeStake: new BN(1000),
        });

        r = await v2.stake(1);
        expect(r).to.have.a.stakeChangedEvent({
            addr: v1.address,
            committeeStake: new BN(1000),
        });

        r = await v2.unstake(2);
        expect(r).to.have.a.stakeChangedEvent({
            addr: v1.address,
            committeeStake: new BN(999),
        });

        r = await v2.stake(11);
        expect(r).to.have.a.stakeChangedEvent({
            addr: v1.address,
            committeeStake: new BN(1000),
        });
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [v1.address],
            stakes: [new BN(1000)]
        });

        r = await v1.stake(2);
        expect(r).to.have.a.stakeChangedEvent({
            addr: v1.address,
            committeeStake: new BN(1012),
        });
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [v1.address],
            stakes: [new BN(1012)]
        });

        r = await v2.stake(30);
        expect(r).to.have.a.stakeChangedEvent({
            addr: v1.address,
            committeeStake: new BN(1020),
        });
        expect(r).to.have.a.committeeChangedEvent({
            addrs: [v1.address],
            stakes: [new BN(1020)]
        });

        r = await v1.stake(1);
        expect(r).to.have.a.stakeChangedEvent({
            addr: v1.address,
            committeeStake: new BN(1030),
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

    it('ensures a non-ready validator cannot join the committee even when owning enough stake', async () => {
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
            r = await v.stake(DEFAULT_MINIMUM_STAKE * i);
            return v;
        }));
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: topology.map(v => v.orbsAddress)
        });

        const newValidator = d.newParticipant();
        await newValidator.registerAsValidator();
        r = await newValidator.stake(DEFAULT_MINIMUM_STAKE * 2);
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: topology.slice(0, DEFAULT_TOPOLOGY_SIZE - 1).map(v => v.orbsAddress).concat(newValidator.orbsAddress)
        });

        const newValidator2 = d.newParticipant();
        await newValidator2.registerAsValidator();
        await newValidator2.notifyReadyForCommittee();
        r = await newValidator2.stake(DEFAULT_MINIMUM_STAKE);
        expect(r).to.not.have.a.topologyChangedEvent();
    });

    it("updates validator metadata only for registered validators", async () => {
        const d = await Driver.new();

        const p = d.newParticipant();
        await p.registerAsValidator();
        let r = await p.stake(DEFAULT_MINIMUM_STAKE);
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: [p.orbsAddress]
        });

        const newIp = "0x11223344";
        r = await d.elections.setValidatorIp(newIp, {from: p.address});
        expect(r).to.have.a.topologyChangedEvent({
            ips: [newIp]
        });

        await p.notifyReadyForCommittee();

        const newAddr = d.newParticipant().address;
        r = await d.elections.setValidatorOrbsAddress(newAddr, {from: p.address});
        expect(r).to.have.a.topologyChangedEvent({
            ips: [newIp],
            orbsAddrs: [newAddr]
        });
        expect(r).to.have.a.committeeChangedEvent({
            orbsAddrs: [newAddr]
        });

        const nonRegistered = d.newParticipant();
        await expectRejected(d.elections.setValidatorIp(newIp, {from: nonRegistered.address}));
        await expectRejected(d.elections.setValidatorOrbsAddress(newAddr, {from: nonRegistered.address}));
    });

    it("performs a batch refresh of stakes", async () => {
        const d = await Driver.new();

        const v1 = d.newParticipant();
        await v1.registerAsValidator();
        await v1.notifyReadyForCommittee();
        await v1.stake(DEFAULT_MINIMUM_STAKE * 2);

        const v2 = d.newParticipant();
        await v2.registerAsValidator();
        await v2.notifyReadyForCommittee();
        await v2.stake(DEFAULT_MINIMUM_STAKE);

        const delegator = d.newParticipant();
        await delegator.stake(DEFAULT_MINIMUM_STAKE * 2);
        let r = await delegator.delegate(v2);

        expect(r).to.have.a.committeeChangedEvent({
            orbsAddrs: [v2, v1].map(v => v.orbsAddress),
            stakes: bn([DEFAULT_MINIMUM_STAKE * 3, DEFAULT_MINIMUM_STAKE * 2])
        });

        // Create a new staking contract and stake different amounts
        const newStaking = await Driver.newStakingContract(d.elections.address, d.erc20.address);
        await d.contractRegistry.set("staking", newStaking.address);

        await v1.stake(DEFAULT_MINIMUM_STAKE * 5, newStaking);
        await v2.stake(DEFAULT_MINIMUM_STAKE * 3, newStaking);
        await delegator.stake(DEFAULT_MINIMUM_STAKE, newStaking);

        // refresh the stakes
        const anonymous = d.newParticipant();
        r = await d.elections.refreshStakes([v1.address, v2.address, delegator.address], {from: anonymous.address});
        expect(r).to.have.a.committeeChangedEvent({
            orbsAddrs: [v1, v2].map(v => v.orbsAddress),
            stakes: bn([DEFAULT_MINIMUM_STAKE * 5, DEFAULT_MINIMUM_STAKE * 4])
        })

    });

    it("allows voting only to 3 at a time", async () => {
        const d = await Driver.new(DEFAULT_COMMITTEE_SIZE, DEFAULT_TOPOLOGY_SIZE, 0);

        let {thresholdCrossingIndex, delegatees, delegators, bannedValidator} = await banningScenario_setupDelegatorsAndValidators(d);

        // -------------- VOTE FOR 3 VALIDATORS AT MOST ---------------
        await expectRejected(d.elections.setBanningVotes(delegatees.slice(0, 4).map(v => v.address), {from: delegators[0].address}));
        await d.elections.setBanningVotes(delegatees.slice(0, 3).map(v => v.address), {from: delegators[0].address});
    });

    it("does not count delegators voting - because they don't have effective governance stake", async () => {
        const d = await Driver.new(DEFAULT_COMMITTEE_SIZE, DEFAULT_TOPOLOGY_SIZE, 0);

        let r;
        let {thresholdCrossingIndex, delegatees, delegators, bannedValidator} = await banningScenario_setupDelegatorsAndValidators(d);

        // -------------- BANNING VOTES CAST BY DELEGATORS - NO GOV STAKE, NO EFFECT ---------------
        for (const delegator of delegators) {
            r = await d.elections.setBanningVotes([bannedValidator.address], {from: delegator.address});
            expect(r).to.have.a.banningVoteEvent({
                voter: delegator.address,
                against: [bannedValidator.address]
            });
            expect(r).to.not.have.a.topologyChangedEvent();
            expect(r).to.not.have.a.bannedEvent();
        }
    });

    it("bans a validator only when accumulated votes stake reaches the threshold", async () => {
        const d = await Driver.new(DEFAULT_COMMITTEE_SIZE, DEFAULT_TOPOLOGY_SIZE, 0);

        let r;
        let {thresholdCrossingIndex, delegatees, delegators, bannedValidator} = await banningScenario_setupDelegatorsAndValidators(d);

        // -------------- CAST VOTES UNDER THE THRESHOLD ---------------

        for (let i = 0; i < thresholdCrossingIndex; i++) {
            const p = delegatees[i];
            r = await d.elections.setBanningVotes([bannedValidator.address], {from: p.address});
            expect(r).to.have.a.banningVoteEvent({
                voter: p.address,
                against: [bannedValidator.address]
            });
            expect(r).to.not.have.a.topologyChangedEvent();
            expect(r).to.not.have.a.bannedEvent();
            expect(r).to.not.have.a.unbannedEvent();
        }

        // -------------- ONE MORE VOTE TO REACH BANNING THRESHOLD ---------------

        r = await d.elections.setBanningVotes([bannedValidator.address], {from: delegatees[thresholdCrossingIndex].address}); // threshold is crossed
        expect(r).to.have.a.banningVoteEvent({
            voter: delegatees[thresholdCrossingIndex].address,
            against: [bannedValidator.address]
        });
        expect(r).to.have.a.bannedEvent({
            validator: bannedValidator.address
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: []
        });
    });

    it("can revoke a vote and unban a validator as a result", async () => {
        const d = await Driver.new(DEFAULT_COMMITTEE_SIZE, DEFAULT_TOPOLOGY_SIZE, 0);

        let r;
        let {thresholdCrossingIndex, delegatees, delegators, bannedValidator} = await banningScenario_setupDelegatorsAndValidators(d);
        await banningScenario_voteUntilThresholdReached(d, thresholdCrossingIndex, delegatees, bannedValidator);

        // -------------- BANNING VOTES REVOKED BY VALIDATOR ---------------

        r = await d.elections.setBanningVotes([], {from: delegatees[thresholdCrossingIndex].address}); // threshold is again uncrossed
        expect(r).to.have.a.banningVoteEvent({
            voter: delegatees[thresholdCrossingIndex].address,
            against: []
        });
        expect(r).to.have.a.unbannedEvent({
            validator: bannedValidator.address
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: [bannedValidator.orbsAddress]
        });
    });

    it("banning does not responds to changes in staking, delegating or voting after locking (one week)", async () => {
        const d = await Driver.new(DEFAULT_COMMITTEE_SIZE, DEFAULT_TOPOLOGY_SIZE, 0);

        let r;
        let {thresholdCrossingIndex, delegatees, delegators, bannedValidator} = await banningScenario_setupDelegatorsAndValidators(d);
        await banningScenario_voteUntilThresholdReached(d, thresholdCrossingIndex, delegatees, bannedValidator);

        // ...*.* TiMe wArP *.*.....
        evmIncreaseTime(BANNING_LOCK_TIMEOUT);

        // -----------------------------------------------------------------------------------
        // -------------- AFTER BANNING LOCKED - TRY TO UNBAN AND ALWAYS FAIL: ---------------
        // -----------------------------------------------------------------------------------

        // -------------- BANNING VOTES REVOKED BY VALIDATOR ---------------

        r = await d.elections.setBanningVotes([], {from: delegatees[thresholdCrossingIndex].address}); // threshold is again uncrossed
        expect(r).to.not.have.a.unbannedEvent();
        expect(r).to.not.have.a.topologyChangedEvent();

        // -------------- DELEGATOR UNSTAKES ---------------

        const tempStake = await d.staking.getStakeBalanceOf(delegators[thresholdCrossingIndex].address);
        r = await d.staking.unstake(tempStake, {from: delegators[thresholdCrossingIndex].address}); // threshold is un-crossed
        expect(r).to.not.have.a.unbannedEvent();
        expect(r).to.not.have.a.topologyChangedEvent();

        // -------------- NEW PARTICIPANT STAKES TO DILUTE BANNING VOTES ---------------

        const dilutingParticipant = d.newParticipant();
        const dilutingStake = DEFAULT_MINIMUM_STAKE * DEFAULT_BANNING_THRESHOLD * 200;
        await dilutingParticipant.stake(dilutingStake);
        expect(r).to.not.have.a.unbannedEvent(); // because we need a trigger to detect the change
        expect(r).to.not.have.a.topologyChangedEvent();

        // trigger - repeat an existing vote:
        const existingVotes = await d.elections.getBanningVotes(delegatees[0].address);
        r = await d.elections.setBanningVotes(existingVotes, {from: delegatees[0].address});

        expect(r).to.not.have.a.unbannedEvent();
        expect(r).to.not.have.a.topologyChangedEvent();

        // -------------- ATTEMPT UNBAN BY DELEGATION - VALIDATOR --------------
        const tipValidator = delegatees[thresholdCrossingIndex];

        const other = d.newParticipant();
        r = await d.elections.delegate(other.address, {from: tipValidator.address}); // delegates to someone else
        expect(r).to.not.have.a.unbannedEvent();
        expect(r).to.not.have.a.topologyChangedEvent();

        // -------------- ATTEMPT UNBAN BY DELEGATION - DELEGATOR --------------
        const tipDelegator = delegators[thresholdCrossingIndex];

        r = await d.elections.delegate(other.address, {from: tipDelegator.address}); // delegates to someone else
        expect(r).to.not.have.a.unbannedEvent();
        expect(r).to.not.have.a.topologyChangedEvent();
    });

    it("banning responds to changes in staking and delegating before locking", async () => {
        const d = await Driver.new(DEFAULT_COMMITTEE_SIZE, DEFAULT_TOPOLOGY_SIZE, 0);

        let r;
        let {thresholdCrossingIndex, delegatees, delegators, bannedValidator} = await banningScenario_setupDelegatorsAndValidators(d);
        await banningScenario_voteUntilThresholdReached(d, thresholdCrossingIndex, delegatees, bannedValidator);

        // -------------- DELEGATOR UNSTAKES AND RESTAKES TO REVOKE BANNING AND REINSTATE BAN ---------------

        const tempStake = await d.staking.getStakeBalanceOf(delegators[thresholdCrossingIndex].address);
        r = await d.staking.unstake(tempStake, {from: delegators[thresholdCrossingIndex].address}); // threshold is un-crossed
        expect(r).to.have.a.unbannedEvent({
            validator: bannedValidator.address
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: [bannedValidator.orbsAddress]
        });

        r = await d.staking.restake({from: delegators[thresholdCrossingIndex].address}); // threshold is crossed again
        expect(r).to.have.a.bannedEvent({
            validator: bannedValidator.address
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: []
        });

        // -------------- NEW PARTICIPANT STAKES TO DILUTE BANNING VOTES, THEN UNSTAKES ---------------

        const originalTotalStake = await d.elections.getTotalGovernanceStake();
        const dilutingParticipant = d.newParticipant();
        const dilutingStake = DEFAULT_MINIMUM_STAKE * DEFAULT_BANNING_THRESHOLD * 200;
        r = await dilutingParticipant.stake(dilutingStake);
        expect(r).to.not.have.a.topologyChangedEvent(); // because we need a trigger to detect the change
        expect(r).to.not.have.a.bannedEvent();
        expect(r).to.not.have.a.unbannedEvent();

        // trigger - repeat an existing vote:
        const existingVotes = await d.elections.getBanningVotes(delegatees[0].address);
        r = await d.elections.setBanningVotes(existingVotes, {from: delegatees[0].address});

        expect(r).to.have.a.unbannedEvent({
            validator: bannedValidator.address
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: [bannedValidator.orbsAddress]
        });

        r = await d.staking.unstake(dilutingStake, {from: dilutingParticipant.address}); // threshold is again crossed
        expect(r).to.not.have.a.topologyChangedEvent(); // because we need a trigger to detect the change
        expect(r).to.not.have.a.bannedEvent();
        expect(r).to.not.have.a.unbannedEvent();

        // trigger - repeat an existing vote:
        r = await d.elections.setBanningVotes(existingVotes, {from: delegatees[0].address});

        expect(r).to.have.a.bannedEvent({
            validator: bannedValidator.address
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: []
        });

        // -------------- UNBAN THEN BAN BY DELEGATION - VALIDATOR --------------
        const tipValidator = delegatees[thresholdCrossingIndex];

        const other = d.newParticipant();
        r = await d.elections.delegate(other.address, {from: tipValidator.address}); // delegates to someone else
        expect(r).to.have.a.unbannedEvent({
            validator: bannedValidator.address
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: [bannedValidator.orbsAddress]
        });

        r = await d.elections.delegate(tipValidator.address, {from: tipValidator.address}); // self delegation
        expect(r).to.have.a.bannedEvent({
            validator: bannedValidator.address
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: []
        });

        // -------------- UNBAN THEN BAN BY DELEGATION - DELEGATOR --------------
        const tipDelegator = delegators[thresholdCrossingIndex];

        r = await d.elections.delegate(other.address, {from: tipDelegator.address}); // delegates to someone else
        expect(r).to.have.a.unbannedEvent({
            validator: bannedValidator.address
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: [bannedValidator.orbsAddress]
        });

        r = await d.elections.delegate(tipValidator.address, {from: tipDelegator.address}); // self delegation
        expect(r).to.have.a.bannedEvent({
            validator: bannedValidator.address
        });
        expect(r).to.have.a.topologyChangedEvent({
            orbsAddrs: []
        });
    });
    //
    // it("allows anyone to refresh a banning vote of another staker to reflect current stake", async () => {
    //     assert(DEFAULT_BANNING_THRESHOLD < 98); // so each committee member will hold a positive stake
    //     assert(Math.floor(DEFAULT_BANNING_THRESHOLD / 2) >= 98 - DEFAULT_BANNING_THRESHOLD); // so the committee list will be ordered by stake
    //
    //     const d = await Driver.new();
    //
    //     const stakesPercentage = [
    //         DEFAULT_BANNING_THRESHOLD,
    //         100 - DEFAULT_BANNING_THRESHOLD - 1,
    //         1
    //     ];
    //
    //     const stakeHolders: Participant[] = [];
    //     for (const p of stakesPercentage) {
    //         const v = d.newParticipant();
    //         await v.stake(DEFAULT_MINIMUM_STAKE * p);
    //         stakeHolders.push(v);
    //     }
    //
    //     const bannedValidator = stakeHolders[stakeHolders.length - 1];
    //     let r = await bannedValidator.registerAsValidator();
    //     expect(r).to.have.a.topologyChangedEvent({
    //         orbsAddrs: [bannedValidator.orbsAddress]
    //     });
    //
    //     r = await d.elections.setBanningVotes(bannedValidator.address, {from: stakeHolders[0].address}); // threshold is crossed
    //     expect(r).to.have.a.banningVoteEvent({
    //         voter: stakeHolders[0].address,
    //         against: bannedValidator.address
    //     });
    //     expect(r).to.have.a.topologyChangedEvent({
    //         orbsAddrs: []
    //     });
    //
    //     r = await stakeHolders[0].unstake(DEFAULT_MINIMUM_STAKE); // threshold is now uncrossed, but banning mechanism is not yet aware
    //     expect(r).to.not.have.a.topologyChangedEvent();
    //
    //     const anonymous = d.newParticipant();
    //     r = await d.elections.refreshBanningVote(stakeHolders[0].address, bannedValidator.address, {from: anonymous.address}); // vote is refreshed to reflect lowered stake, validator should be unbanned
    //     expect(r).to.have.a.topologyChangedEvent({
    //         orbsAddrs: [bannedValidator.orbsAddress]
    //     });
    //
    // });
    //
    // it("does not cast a banning vote by refreshBanningVote", async () => {
    //     assert(DEFAULT_BANNING_THRESHOLD < 98); // so each committee member will hold a positive stake
    //     assert(Math.floor(DEFAULT_BANNING_THRESHOLD / 2) >= 98 - DEFAULT_BANNING_THRESHOLD); // so the committee list will be ordered by stake
    //
    //     const d = await Driver.new();
    //
    //     const stakesPercentage = [
    //         DEFAULT_BANNING_THRESHOLD,
    //         100 - DEFAULT_BANNING_THRESHOLD - 1,
    //         1
    //     ];
    //
    //     const stakeHolders: Participant[] = [];
    //     for (const p of stakesPercentage) {
    //         const v = d.newParticipant();
    //         await v.stake(DEFAULT_MINIMUM_STAKE * p);
    //         stakeHolders.push(v);
    //     }
    //
    //     const bannedValidator = stakeHolders[stakeHolders.length - 1];
    //     let r = await bannedValidator.registerAsValidator();
    //     expect(r).to.have.a.topologyChangedEvent({
    //         orbsAddrs: [bannedValidator.orbsAddress]
    //     });
    //
    //     const anonymous = d.newParticipant();
    //
    //     // vote was not cast initially, so refreshing it should not caused a ban
    //     r = await d.elections.refreshBanningVote(stakeHolders[0].address, bannedValidator.address, {from: anonymous.address});
    //     expect(r).to.not.have.a.topologyChangedEvent();
    // });

});

async function banningScenario_setupDelegatorsAndValidators(driver) {
    assert(DEFAULT_BANNING_THRESHOLD < 98); // so each committee member will hold a positive stake
    assert(Math.floor(DEFAULT_BANNING_THRESHOLD / 2) >= 98 - DEFAULT_BANNING_THRESHOLD); // so the committee list will be ordered by stake


    // -------------- SETUP ---------------
    const stakesPercentage = [
        Math.ceil(DEFAULT_BANNING_THRESHOLD / 2),
        Math.floor(DEFAULT_BANNING_THRESHOLD / 2),
        98 - DEFAULT_BANNING_THRESHOLD,
        1,
        1
    ];
    const thresholdCrossingIndex = 1;
    const delegatees: Participant[] = [];
    const delegators: Participant[] = [];
    for (const p of stakesPercentage) {
        // stake holders will not have own stake, only delegated - to test the use of governance stake
        const delegator = driver.newParticipant();
        await delegator.stake(DEFAULT_MINIMUM_STAKE * p);
        const v = driver.newParticipant();
        await delegator.delegate(v);
        delegatees.push(v);
        delegators.push(delegator);
    }

    const bannedValidator = delegatees[delegatees.length - 1];
    let r = await bannedValidator.registerAsValidator();
    expect(r).to.have.a.topologyChangedEvent({
        orbsAddrs: [bannedValidator.orbsAddress]
    });
    return {thresholdCrossingIndex, delegatees, delegators, bannedValidator};
}

async function banningScenario_voteUntilThresholdReached(driver, thresholdCrossingIndex, delegatees, bannedValidator) {
    let r;
    for (let i = 0; i <= thresholdCrossingIndex; i++) {
        const p = delegatees[i];
        r = await driver.elections.setBanningVotes([bannedValidator.address], {from: p.address});
    }
    expect(r).to.have.a.banningVoteEvent({
        voter: delegatees[thresholdCrossingIndex].address,
        against: [bannedValidator.address]
    });
    expect(r).to.have.a.bannedEvent({
        validator: bannedValidator.address
    });
    expect(r).to.have.a.topologyChangedEvent({
        orbsAddrs: []
    });
}
