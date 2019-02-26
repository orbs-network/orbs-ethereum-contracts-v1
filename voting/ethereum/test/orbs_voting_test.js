
const VotingContract = artifacts.require('OrbsVoting');

const harness = require('./harness');

contract('Voting', accounts => {
    describe('when calling the vote() function', () => {
        it('should emit one Vote event', async () => {
            let instance = await VotingContract.deployed();

            let receipt = await instance.vote(accounts);

            let e = receipt.logs[0];
            assert.equal(e.event, "Vote");
            assert.equal(e.args.voter, accounts[0]);
            assert.equal(e.args.vote_counter, 1);
            assert.deepEqual(e.args.nodes_list, accounts);
        });

        it('should increment vote_counter', async () => {
            let instance = await VotingContract.deployed();

            let receipt1 = await instance.vote(accounts);
            let receipt2 = await instance.vote(accounts);

            let getCounter = receipt => receipt.logs[0].args.vote_counter.toNumber();

            assert.deepEqual(getCounter(receipt1) + 1, getCounter(receipt2))
        });

        it('should reject calls with empty array', async () => {
            let instance = await VotingContract.deployed();

            await harness.assertReject(instance.vote([]));
        });

        it('should reject calls with 0 address', async () => {
            let instance = await VotingContract.deployed();

            await harness.assertReject(instance.vote([harness.numToAddress(1), harness.numToAddress(0)]));
        });

        it('should consume gas consistently regardless of voting history', async () => {
            // TODO send 1 + (batch of 500) + 1 vote transactions. compare the gas spent by the first and last. they must be identical
        });
    });

    describe('when calling the delegate() function', () => {
        it('should emit one Delegate event', async () => {
            let instance = await VotingContract.deployed();
            let to = harness.numToAddress(1);

            let receipt = await instance.delegate(to);

            let e = receipt.logs[0];
            assert.equal(e.event, "Delegate");
            assert.equal(e.args.stakeholder, accounts[0]);
            assert.equal(e.args.to, to);
            assert.equal(e.args.delegation_counter, 1);
        });

        it('should increment delegation_counter', async () => {
            let instance = await VotingContract.deployed();
            let to = harness.numToAddress(1);

            let receipt1 = await instance.delegate(to);
            let receipt2 = await instance.delegate(to);

            let getCounter = receipt => receipt.logs[0].args.delegation_counter.toNumber();

            assert.deepEqual(getCounter(receipt1) + 1, getCounter(receipt2))
        });
    });

    describe('when calling the getLastVote() function', () => {
        it('returns the last vote made by a voter', async () => {
            let instance = await VotingContract.deployed();

            const firstVote = [harness.numToAddress(6), harness.numToAddress(7)];
            const secondVote = [harness.numToAddress(8), harness.numToAddress(9)];

            const firstVoteBlockHeight = await instance.vote(firstVote).then(r => r.receipt.blockNumber);
            const reportedFirstVote = await instance.getLastVote(accounts[0]);

            assert.deepEqual(reportedFirstVote[0], firstVote);
            assert.equal(reportedFirstVote[1].toNumber(), firstVoteBlockHeight);

            assert.deepEqual(reportedFirstVote[0], reportedFirstVote.nodes, "expected first item in tuple to be nodes");
            assert.equal(reportedFirstVote[1].toNumber(), reportedFirstVote.block_height.toNumber(), "expected second item in tuple to be block height");

            const secondVoteBlockHeight = await instance.vote(secondVote).then(r => r.receipt.blockNumber);
            const reportedSecondVote = await instance.getLastVote(accounts[0]);

            assert.deepEqual(reportedSecondVote[0], secondVote);
            assert.equal(reportedSecondVote[1].toNumber(), secondVoteBlockHeight);
        });

        it('fails if guardian never voted', async () => {
            let instance = await VotingContract.deployed();
            await harness.assertReject(instance.getLastVote(harness.numToAddress(654)));
        });
    });
});

