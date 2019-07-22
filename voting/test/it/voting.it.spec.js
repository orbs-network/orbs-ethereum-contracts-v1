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
    })

    after(() => ethereum.stop());

    it("perform elections to determine the active validators", async () => {

        const options = {
            maxVoteOut: 3,
            validatorsLimit: 20,
            minRegistrationSeconds: 0,
            votingMirrorPeriod: 10,
            votingValidityPeriod: 500,
            electionsPeriod: 200,
            maxElected: 5,
            minElected: 3
        };
        const electionContracts = new ElectionContracts(ethereum, orbs, ethereumUrl, options);
        await electionContracts.deploy();

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
            shf.aDelegator({stake: 0}),
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

        // TODO verify that all this voting and delegating happened before the first election period begins to that they count for the next election:
        // if config.FirstElectionBlockNumber != 0 {
        //     currentBlock := ethereum.GetCurrentBlock()
        //     require.True(t, currentBlock < config.FirstElectionBlockNumber, "Recorded activity will not be included in the current election period")
        // }
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

        // XXXX end of flow. gamma does not enforce the results of elections on validator committee. it requies an "unsafe_" operation. consider supporting
    })
});
