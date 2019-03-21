
const {Driver, numToAddress} = require('./driver');
const {assertResolve, assertReject} = require('./assertExtensions');

contract('Voting', accounts => {
    let driver;

    const suspiciousNodes = [accounts[1], accounts[2], accounts[3]];
    beforeEach(() => {
        driver = new Driver();
    });

    describe('is not payable', () => {
        it('rejects payments', async () => {
            await driver.deployVoting();
            await assertReject(web3.eth.sendTransaction({
                to: driver.OrbsVoting.address,
                from: accounts[0],
                value: 1
            }), "expected payment to fail");
            assert(await web3.eth.getBalance(accounts[0]) >= 1, "expected main account to have wei");
        });
    });

    describe('when calling the voteOut() function', () => {
        it('should emit one VoteOut event', async () => {
            await driver.deployVoting();

            const receipt = await driver.OrbsVoting.voteOut(suspiciousNodes);

            const e = receipt.logs[0];
            assert.equal(e.event, "VoteOut");
            assert.equal(e.args.voter, accounts[0]);
            assert.equal(e.args.voteCounter, 1);
            assert.deepEqual(e.args.validators, suspiciousNodes);
        });

        it('should increment voteCounter', async () => {
            await driver.deployVoting();

            let receipt1 = await driver.OrbsVoting.voteOut(suspiciousNodes);
            let receipt2 = await driver.OrbsVoting.voteOut(suspiciousNodes);

            let getCounter = receipt => receipt.logs[0].args.voteCounter.toNumber();

            assert.deepEqual(getCounter(receipt1) + 1, getCounter(receipt2))
        });

        it('should allow voting no one out', async () => {
            await driver.deployVoting();

            let receipt = await assertResolve(driver.OrbsVoting.voteOut([]), "voting no one out should succeed");

            const e = receipt.logs[0];
            assert.equal(e.event, "VoteOut");
            assert.equal(e.args.voter, accounts[0]);
            assert.equal(e.args.voteCounter, 1);
            assert.deepEqual(e.args.validators, []);
        });

        it('should disallow voting for too many nodes', async () => {
            await driver.deployVoting(suspiciousNodes.length - 1);

            await assertReject(driver.OrbsVoting.voteOut(suspiciousNodes), "voting for too many nodes should fail");
        });

        it('should reject calls with 0 address', async () => {
            await driver.deployVoting();

            await assertReject(driver.OrbsVoting.voteOut([numToAddress(1), numToAddress(0)]));
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
            assert.equal(e.args.delegationCounter, 1);
        });

        it('should increment delegationCounter', async () => {
            await driver.deployVoting();
            let to = numToAddress(1);

            let receipt1 = await driver.OrbsVoting.delegate(to);
            let receipt2 = await driver.OrbsVoting.delegate(to);

            let getCounter = receipt => receipt.logs[0].args.delegationCounter.toNumber();

            assert.deepEqual(getCounter(receipt1) + 1, getCounter(receipt2))
        });

        it('should reject delegation to 0 address', async () => {
            await driver.deployVoting();
            let to = numToAddress(0);

            await assertReject(driver.OrbsVoting.delegate(to), "expected delegating to zero address to fail");
        });
    });

    describe('when calling the getCurrentDelegation(delegator) function', () => {
        it('returns the last delegation made by delegator', async () => {
            await driver.deployVoting();
            const delegator = accounts[3];
            const to = [1,2].map(i => numToAddress(i));

            const readDelegation0 = await driver.OrbsVoting.getCurrentDelegation(delegator);
            assert.equal(readDelegation0, numToAddress(0), "current delegation should be zero before delegating");

            await driver.OrbsVoting.delegate(to[0], {from: delegator});
            const readDelegation1 = await driver.OrbsVoting.getCurrentDelegation(delegator);
            assert.equal(readDelegation1, to[0], "current delegation should be the last delegated to after first delegation");

            await driver.OrbsVoting.delegate(to[1], {from: delegator});
            const readDelegation2 = await driver.OrbsVoting.getCurrentDelegation(delegator);
            assert.equal(readDelegation2, to[1], "current delegation should be the last delegated to after additional delegations");
        });
    });

    describe('when fetching current vote', () => {
        [
            {funcName: "getCurrentVote", fieldName: "validators"},
            {funcName: "getCurrentVoteBytes20", fieldName: "validatorsBytes20"}
        ].forEach((getlastVoteVariation) => {

            context(`with ${getlastVoteVariation}()`, async () => {
                let functionUnderTest;
                let validatorsReturnFieldName;
                beforeEach(async () => {
                    await driver.deployVoting();
                    functionUnderTest = driver.OrbsVoting[getlastVoteVariation.funcName];
                    validatorsReturnFieldName = getlastVoteVariation.fieldName;
                });

                it('returns the last vote made by a voter', async () => {
                    const firstVote = [numToAddress(6), numToAddress(7)];
                    const secondVote = [numToAddress(8), numToAddress(9)];

                    const firstVoteBlockNumber = await driver.OrbsVoting.voteOut(firstVote).then(r => r.receipt.blockNumber);
                    const reportedFirstVote = await functionUnderTest(accounts[0]);

                    assert.deepEqual(reportedFirstVote[0].map(a => web3.utils.toChecksumAddress(a)), firstVote);
                    assert.equal(reportedFirstVote[1].toNumber(), firstVoteBlockNumber);

                    assert.deepEqual(reportedFirstVote[0].map(a => web3.utils.toChecksumAddress(a)), reportedFirstVote[validatorsReturnFieldName], "expected first item in tuple to be nodes");
                    assert.equal(reportedFirstVote[1].toNumber(), reportedFirstVote.blockNumber.toNumber(), "expected second item in tuple to be block height");

                    const secondVoteBlockNumber = await driver.OrbsVoting.voteOut(secondVote).then(r => r.receipt.blockNumber);
                    const reportedSecondVote = await functionUnderTest(accounts[0]);

                    assert.deepEqual(reportedSecondVote[0].map(a => web3.utils.toChecksumAddress(a)), secondVote);
                    assert.equal(reportedSecondVote[1].toNumber(), secondVoteBlockNumber);
                });

                it('fails if guardian never voted', async () => {
                    await assertReject(functionUnderTest(numToAddress(654)));
                });
            });
        });
    });
});

