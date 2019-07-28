const {EthereumAdapter, OrbsAdapter} = require("psilo");
const {expect} = require("chai");
const {ElectionContracts} = require("./driver");

describe("voting contracts on orbs and ethereum", async () => {
    const ethereumUrl = process.env.GANACHE_URL || "http://localhost:7545";
    let ethereum;
    let orbs;

    before(async () => {
        ethereum = await EthereumAdapter.build(ethereumUrl);
        orbs = await OrbsAdapter.build();
    });

    after(() => ethereum.stop());

    it("perform two block-based elections", async () => {

        const options = {
            maxVoteOut: 3,
            validatorsLimit: 20,
            minRegistrationSeconds: 0,
            votingMirrorPeriod: 10,
            votingValidityPeriod: 200,
            electionsPeriod: 100,
            maxElected: 5,
            minElected: 3
        };
        const electionContracts = new ElectionContracts(ethereum, orbs, ethereumUrl, options);
        await electionContracts.deploy();
        await electionContracts.waitForMinimumBlocksAndPeriod();

        const shf = electionContracts.newStakeHolderFactory();

        const [v1, v2, v3, v4, v5] = await Promise.all([
            shf.aValidator({stake: 10000}),
            shf.aValidator({stake: 20000}),
            shf.aValidator({stake: 15000}),
            shf.aValidator({stake: 5000}),
            shf.aValidator({stake: 7000})]);

        // sanity - all validators are listed in both contracts
        const orbsValidatorAddresses = await electionContracts.getOrbsValidatorAddresses();
        expect(orbsValidatorAddresses.map(a => a.toLowerCase())).to.have.members([v1, v2, v3, v4, v5].map(v => v.orbsAccount.address.toLowerCase()));

        const [g1, g2, g3, g4] = await Promise.all([
            shf.aGuardian({stake: 6000}),
            await shf.aGuardian({stake: 34000}),
            await shf.aGuardian({stake: 5000}),
            await shf.aGuardian({stake: 0})
        ]);

        // TODO verify registration?

        const [d0, d1, d2, d3, d4, d5, d6, d7, d8, d9] = await Promise.all([
            shf.aDelegator({stake: 10000}),
            shf.aDelegator({stake: 10000}),
            shf.aDelegator({stake: 8000}),
            shf.aDelegator({stake: 8000}),
            shf.aDelegator({stake: 6000}),
            shf.aDelegator({stake: 6000}),
            shf.aDelegator({stake: 34000}),
            shf.aDelegator({stake: 10}),
            shf.aDelegator({stake: 20000}),
            shf.aDelegator({stake: 5000}),
        ]);

        await shf.waitForFundingSuccess(); //TODO we don't need this anymore, make initStakeHolder() wait for this promise
        const DELEGATE_AMOUNT = ethereum.web3.utils.toBN("70000000000000000");

        await Promise.all([
            d0.transferTo(d6, DELEGATE_AMOUNT),
            d2.transferTo(d6, DELEGATE_AMOUNT),
            d5.transferTo(d3, DELEGATE_AMOUNT),
            d8.transferTo(d4, 50),
            d8.transferTo(d4, DELEGATE_AMOUNT),
            d8.transferTo(d1, 10),
            d3.transferTo(g3, DELEGATE_AMOUNT),
            d9.transferTo(g3, DELEGATE_AMOUNT),
            d1.transferTo(d6, DELEGATE_AMOUNT),
            d2.transferTo(d4, DELEGATE_AMOUNT),
            d8.transferTo(d6, DELEGATE_AMOUNT),
            d5.transferTo(d9, 10),
            // TODO verify transfers

            d1.delegateExplicitly(d4),
            d7.delegateExplicitly(g3),

            // TODO verify delegation in contract state

            g1.voteOut(v1, v3),
            g3.voteOut(v3, v4, v5),
            g2.voteOut(v3),
            g1.voteOut(v2), // second vote
            g4.voteOut(),
            d2.voteOut(v5, v2, v3), // not an guardian
        ]);

        console.log("Start First Block Election");

        const nextElectionBlockNumber = await electionContracts.setElectionBlockNumber();

        await electionContracts.waitForOrbsFinality(nextElectionBlockNumber);

        await electionContracts.goodSamaritanMirrorsAll(nextElectionBlockNumber);
        //TODO return something from mirror and assert

        console.log("Done Mirroring");

        const mirrorPeriodEndBlock = nextElectionBlockNumber + options.votingMirrorPeriod + 1;

        await electionContracts.waitForOrbsFinality(mirrorPeriodEndBlock);

        await electionContracts.goodSamaritanProcessesAll();
        //TODO return something from process and assert

        console.log("Done Processing");

        const winners = await electionContracts.getElectionWinners();
        expect(winners).to.have.members([v1, v2, v4, v5].map(v => v.orbsAccount.address)); // TODO - which should be voted in???

        // check reward  added to v1 and v2 with time based values.
        expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v1.address))).to.be.equal(8533); // +8533
        expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v2.address))).to.be.equal(8536); // +8536

        console.log("Done First Election\n");

        console.log("Start Second Block Election");
        // change election
        await g1.voteOut(v1);
        await g2.voteOut(v1);
        await g3.voteOut(v1);
        await g4.voteOut(v1);

        await electionContracts.waitForOrbsFinality();

        const nextElectionBlockNumber2 = await electionContracts.setElectionBlockNumber();

        await electionContracts.waitForOrbsFinality(nextElectionBlockNumber2);

        await electionContracts.goodSamaritanMirrorsAll(nextElectionBlockNumber2);
        //TODO return something from mirror and assert

        console.log("Done Mirroring");

        const mirrorPeriodEndBlock2 = nextElectionBlockNumber2 + options.votingMirrorPeriod + 1;

        await electionContracts.waitForOrbsFinality(mirrorPeriodEndBlock2);

        await electionContracts.goodSamaritanProcessesAll();
        //TODO return something from process and assert

        console.log("Done Processing");

        const winners2 = await electionContracts.getElectionWinners();
        expect(winners2).to.have.members([v2, v3, v4, v5].map(v => v.orbsAccount.address)); // TODO - which should be voted in???

        // check reward  added to v1 and v2 with time based values.
        expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v1.address))).to.be.equal(8533); // +0
        return expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v2.address))).to.be.equal(2*8536); // +8536
    });

    it("perform two time based elections", async () => {
        const options = {
            maxVoteOut: 3,
            validatorsLimit: 20,
            minRegistrationSeconds: 0,
            votingMirrorPeriodInSeconds: 3,
            votingValidityPeriodInSeconds: 140,
            electionsPeriodInSeconds: 20,
            maxElected: 5,
            minElected: 3
        };
        const electionContracts = new ElectionContracts(ethereum, orbs, ethereumUrl, options);
        await electionContracts.deploy();
        await electionContracts.waitForMinimumBlocksAndPeriod();

        const shf = electionContracts.newStakeHolderFactory();

        const [v1, v2, v3, v4, v5] = await Promise.all([
            shf.aValidator({stake: 10000}),
            shf.aValidator({stake: 20000}),
            shf.aValidator({stake: 15000}),
            shf.aValidator({stake: 5000}),
            shf.aValidator({stake: 7000})]);

        // sanity - all validators are listed in both contracts
        const orbsValidatorAddresses = await electionContracts.getOrbsValidatorAddresses();
        expect(orbsValidatorAddresses.map(a => a.toLowerCase())).to.have.members([v1, v2, v3, v4, v5].map(v => v.orbsAccount.address.toLowerCase()));

        const [g1, g2, g3, g4] = await Promise.all([
            shf.aGuardian({stake: 6000}),
            await shf.aGuardian({stake: 34000}),
            await shf.aGuardian({stake: 5000}),
            await shf.aGuardian({stake: 0})
        ]);

        // TODO verify registration?

        const [d0, d1, d2, d3, d4, d5, d6, d7, d8, d9] = await Promise.all([
            shf.aDelegator({stake: 10000}),
            shf.aDelegator({stake: 10000}),
            shf.aDelegator({stake: 8000}),
            shf.aDelegator({stake: 8000}),
            shf.aDelegator({stake: 6000}),
            shf.aDelegator({stake: 6000}),
            shf.aDelegator({stake: 34000}),
            shf.aDelegator({stake: 10}),
            shf.aDelegator({stake: 20000}),
            shf.aDelegator({stake: 5000}),
        ]);

        await shf.waitForFundingSuccess(); //TODO we don't need this anymore, make initStakeHolder() wait for this promise
        const DELEGATE_AMOUNT = ethereum.web3.utils.toBN("70000000000000000");

        await Promise.all([
            d0.transferTo(d6, DELEGATE_AMOUNT),
            d2.transferTo(d6, DELEGATE_AMOUNT),
            d5.transferTo(d3, DELEGATE_AMOUNT),
            d8.transferTo(d4, 50),
            d8.transferTo(d4, DELEGATE_AMOUNT),
            d8.transferTo(d1, 10),
            d3.transferTo(g3, DELEGATE_AMOUNT),
            d9.transferTo(g3, DELEGATE_AMOUNT),
            d1.transferTo(d6, DELEGATE_AMOUNT),
            d2.transferTo(d4, DELEGATE_AMOUNT),
            d8.transferTo(d6, DELEGATE_AMOUNT),
            d5.transferTo(d9, 10),
            // TODO verify transfers

            d1.delegateExplicitly(d4),
            d7.delegateExplicitly(g3),

            // TODO verify delegation in contract state

            g1.voteOut(v1, v3),
            g3.voteOut(v3, v4, v5),
            g2.voteOut(v3),
            g1.voteOut(v2), // second vote
            g4.voteOut(),
            d2.voteOut(v5, v2, v3), // not an guardian
        ]);

        await electionContracts.waitForOrbsFinality();
        console.log("\nStart First Time Election");

        const blockBeforeElection = await electionContracts.setElectionTimeToCurrentEthereumTime();
        await electionContracts.waitForOrbsFinality(blockBeforeElection);

        await electionContracts.goodSamaritanMirrorsAll();
        //TODO return something from mirror and assert
        console.log("Done Mirroring\n");

        console.log("Await time to start processing ...");
        await electionContracts.waitForOrbsFinality(blockBeforeElection + options.votingMirrorPeriodInSeconds);

        await electionContracts.goodSamaritanProcessesAll();
        //TODO return something from process and assert

        console.log("Done Processing\n");

        const winners = await electionContracts.getElectionWinners();
        expect(winners).to.have.members([v1, v2, v4, v5].map(v => v.orbsAccount.address)); // TODO - which should be voted in???

        // check reward  added to v1 and v2 with time based values.
        expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v1.address))).to.be.equal(8217); // +8217
        expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v2.address))).to.be.equal(8220); // +8220

        console.log("Done First Election\n");

        console.log("Start Second Time Election");
        // change election
        await g1.voteOut(v1);
        await g2.voteOut(v1);
        await g3.voteOut(v1);
        await g4.voteOut(v1);

        await electionContracts.waitForOrbsFinality();

        const blockBeforeSecondElection = await electionContracts.setElectionTimeToCurrentEthereumTime();
        await electionContracts.waitForOrbsFinality(blockBeforeSecondElection);

        await electionContracts.goodSamaritanMirrorsAll();
        //TODO return something from mirror and assert
        console.log("Done Mirroring\n");

        console.log("Await time to start processing ...");
        await electionContracts.waitForOrbsFinality(blockBeforeSecondElection + options.votingMirrorPeriodInSeconds);

        await electionContracts.goodSamaritanProcessesAll();
        //TODO return something from process and assert

        console.log("Done Processing\n");

        const winnersSecond = await electionContracts.getElectionWinners();
        expect(winnersSecond).to.have.members([v2, v3, v4, v5].map(v => v.orbsAccount.address)); // TODO - which should be voted in???

        console.log("Done Second Election");

        // check reward not added to v1 (vote out), added to v2
        expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v1.address))).to.be.equal(8217); // +0
        return expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v2.address))).to.be.equal(2*8220); // +8220
    });

    it("perform block based elections then time based elections", async () => {
        const options = {
            maxVoteOut: 3,
            validatorsLimit: 20,
            minRegistrationSeconds: 0,
            votingMirrorPeriod: 10,
            votingValidityPeriod: 200,
            electionsPeriod: 100,
            votingMirrorPeriodInSeconds: 3,
            votingValidityPeriodInSeconds: 140,
            electionsPeriodInSeconds: 20,
            maxElected: 5,
            minElected: 3
        };
        const electionContracts = new ElectionContracts(ethereum, orbs, ethereumUrl, options);
        await electionContracts.deploy();
        await electionContracts.waitForMinimumBlocksAndPeriod();

        const shf = electionContracts.newStakeHolderFactory();

        const [v1, v2, v3, v4, v5] = await Promise.all([
            shf.aValidator({stake: 10000}),
            shf.aValidator({stake: 20000}),
            shf.aValidator({stake: 15000}),
            shf.aValidator({stake: 5000}),
            shf.aValidator({stake: 7000})]);

        // sanity - all validators are listed in both contracts
        const orbsValidatorAddresses = await electionContracts.getOrbsValidatorAddresses();
        expect(orbsValidatorAddresses.map(a => a.toLowerCase())).to.have.members([v1, v2, v3, v4, v5].map(v => v.orbsAccount.address.toLowerCase()));

        const [g1, g2, g3, g4] = await Promise.all([
            shf.aGuardian({stake: 6000}),
            await shf.aGuardian({stake: 34000}),
            await shf.aGuardian({stake: 5000}),
            await shf.aGuardian({stake: 0})
        ]);

        // TODO verify registration?

        const [d0, d1, d2, d3, d4, d5, d6, d7, d8, d9] = await Promise.all([
            shf.aDelegator({stake: 10000}),
            shf.aDelegator({stake: 10000}),
            shf.aDelegator({stake: 8000}),
            shf.aDelegator({stake: 8000}),
            shf.aDelegator({stake: 6000}),
            shf.aDelegator({stake: 6000}),
            shf.aDelegator({stake: 34000}),
            shf.aDelegator({stake: 10}),
            shf.aDelegator({stake: 20000}),
            shf.aDelegator({stake: 5000}),
        ]);

        await shf.waitForFundingSuccess();
        const DELEGATE_AMOUNT = ethereum.web3.utils.toBN("70000000000000000");

        await Promise.all([
            d0.transferTo(d6, DELEGATE_AMOUNT),
            d2.transferTo(d6, DELEGATE_AMOUNT),
            d5.transferTo(d3, DELEGATE_AMOUNT),
            d8.transferTo(d4, 50),
            d8.transferTo(d4, DELEGATE_AMOUNT),
            d8.transferTo(d1, 10),
            d3.transferTo(g3, DELEGATE_AMOUNT),
            d9.transferTo(g3, DELEGATE_AMOUNT),
            d1.transferTo(d6, DELEGATE_AMOUNT),
            d2.transferTo(d4, DELEGATE_AMOUNT),
            d8.transferTo(d6, DELEGATE_AMOUNT),
            d5.transferTo(d9, 10),
            // TODO verify transfers

            d1.delegateExplicitly(d4),
            d7.delegateExplicitly(g3),

            // TODO verify delegation in contract state

            g1.voteOut(v1, v3),
            g3.voteOut(v3, v4, v5),
            g2.voteOut(v3),
            g1.voteOut(v2), // second vote
            g4.voteOut(),
            d2.voteOut(v5, v2, v3), // not an guardian
        ]);

        console.log("Start A Block Election as first");

        const nextElectionBlockNumber = await electionContracts.setElectionBlockNumber();

        await electionContracts.waitForOrbsFinality(nextElectionBlockNumber);

        await electionContracts.goodSamaritanMirrorsAll(nextElectionBlockNumber);
        //TODO return something from mirror and assert

        console.log("Done Mirroring");

        const mirrorPeriodEndBlock = nextElectionBlockNumber + options.votingMirrorPeriod + 1;

        await electionContracts.waitForOrbsFinality(mirrorPeriodEndBlock);

        await electionContracts.goodSamaritanProcessesAll();
        //TODO return something from process and assert

        console.log("Done Processing");

        const winners = await electionContracts.getElectionWinners();
        expect(winners).to.have.members([v1, v2, v4, v5].map(v => v.orbsAccount.address)); // TODO - which should be voted in???

        // check reward  added to v1 and v2 with time based values.
        expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v1.address))).to.be.equal(8533); // +8533
        expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v2.address))).to.be.equal(8536); // +8536

        console.log("Done First Election\n");

        console.log("Start A Time Election as second");

        // change election
        await g1.voteOut(v1);
        await g2.voteOut(v1);
        await g3.voteOut(v1);
        await g4.voteOut(v1);

        await electionContracts.waitForOrbsFinality();

        const blockBeforeSecondElection = await electionContracts.setElectionTimeToCurrentEthereumTime();
        await electionContracts.waitForOrbsFinality(blockBeforeSecondElection);

        await electionContracts.goodSamaritanMirrorsAll();
        //TODO return something from mirror and assert
        console.log("Done Mirroring\n");

        console.log("Await time to start processing ...");
        await electionContracts.waitForOrbsFinality(blockBeforeSecondElection + options.votingMirrorPeriodInSeconds);

        await electionContracts.goodSamaritanProcessesAll();
        //TODO return something from process and assert

        console.log("Done Processing\n");

        const winnersSecond = await electionContracts.getElectionWinners();
        expect(winnersSecond).to.have.members([v2, v3, v4, v5].map(v => v.orbsAccount.address)); // TODO - which should be voted in???

        console.log("Done Second Election");

        // check reward not added to v1 (vote out), added to v2
        expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v1.address))).to.be.equal(8533); // +0
        return expect(await electionContracts.getOrbsValidatorReward(electionContracts.addressWithoutChecksum(v2.address))).to.be.equal(8536+8220); // +8220
    });

});

