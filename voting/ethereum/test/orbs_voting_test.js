
const {Driver, numToAddress} = require('./driver');
const {assertResolve, assertReject} = require('./assertExtensions');

contract('Voting', accounts => {
    let driver;

    beforeEach(() => {
        driver = new Driver();
    });

    describe('when calling the vote() function', () => {
        it('should emit one Vote event', async () => {
            await driver.deployVoting();

            let receipt = await driver.OrbsVoting.vote(accounts);

            let e = receipt.logs[0];
            assert.equal(e.event, "Vote");
            assert.equal(e.args.voter, accounts[0]);
            assert.equal(e.args.vote_counter, 1);
            assert.deepEqual(e.args.nodes_list, accounts.map(a => a.toLowerCase()));
        });

        it('should increment vote_counter', async () => {
            await driver.deployVoting();

            let receipt1 = await driver.OrbsVoting.vote(accounts);
            let receipt2 = await driver.OrbsVoting.vote(accounts);

            let getCounter = receipt => receipt.logs[0].args.vote_counter.toNumber();

            assert.deepEqual(getCounter(receipt1) + 1, getCounter(receipt2))
        });

        it('should reject calls with empty array', async () => {
            await driver.deployVoting();

            await assertReject(driver.OrbsVoting.vote([]));
        });

        it('should reject calls with 0 address', async () => {
            await driver.deployVoting();

            await assertReject(driver.OrbsVoting.vote([numToAddress(1), numToAddress(0)]));
        });

        it('should consume gas consistently regardless of voting history', async () => {
            // TODO send 1 + (batch of 500) + 1 vote transactions. compare the gas spent by the first and last. they must be identical
        });
    });

    describe('when calling the delegate() function', () => {
        it('should emit one Delegate event', async () => {
            await driver.deployVoting();
            let to = numToAddress(1);

            let receipt = await driver.OrbsVoting.delegate(to);

            let e = receipt.logs[0];
            assert.equal(e.event, "Delegate");
            assert.equal(e.args.delegator, accounts[0]);
            assert.equal(e.args.to, to);
            assert.equal(e.args.delegation_counter, 1);
        });

        it('should increment delegation_counter', async () => {
            await driver.deployVoting();
            let to = numToAddress(1);

            let receipt1 = await driver.OrbsVoting.delegate(to);
            let receipt2 = await driver.OrbsVoting.delegate(to);

            let getCounter = receipt => receipt.logs[0].args.delegation_counter.toNumber();

            assert.deepEqual(getCounter(receipt1) + 1, getCounter(receipt2))
        });
    });

    describe('when calling the getLastVote() function', () => {
        it('returns the last vote made by a voter', async () => {
            await driver.deployVoting();

            const firstVote = [numToAddress(6), numToAddress(7)];
            const secondVote = [numToAddress(8), numToAddress(9)];

            const firstVoteBlockHeight = await driver.OrbsVoting.vote(firstVote).then(r => r.receipt.blockNumber);
            const reportedFirstVote = await driver.OrbsVoting.getLastVote(accounts[0]);

            assert.deepEqual(reportedFirstVote[0], firstVote);
            assert.equal(reportedFirstVote[1].toNumber(), firstVoteBlockHeight);

            assert.deepEqual(reportedFirstVote[0], reportedFirstVote.nodes, "expected first item in tuple to be nodes");
            assert.equal(reportedFirstVote[1].toNumber(), reportedFirstVote.block_height.toNumber(), "expected second item in tuple to be block height");

            const secondVoteBlockHeight = await driver.OrbsVoting.vote(secondVote).then(r => r.receipt.blockNumber);
            const reportedSecondVote = await driver.OrbsVoting.getLastVote(accounts[0]);

            assert.deepEqual(reportedSecondVote[0], secondVote);
            assert.equal(reportedSecondVote[1].toNumber(), secondVoteBlockHeight);
        });

        it('fails if guardian never voted', async () => {
            await driver.deployVoting();
            await assertReject(driver.OrbsVoting.getLastVote(numToAddress(654)));
        });
    });
});

