const assert = require('assert');
describe('Voting Contract', async function() {

    describe('vote', function() {
        it('should emit events', async function() {
            const VotingContract = artifacts.require('Voting');
            const instance = await VotingContract.deployed();
            const accounts = await web3.eth.getAccounts();


            let receipt = await instance.vote(accounts);
            assert.equal(receipt.logs.length, accounts.length);

            receipt.logs.forEach( log => {
                assert.equal(log.event, "Vote")
                assert.equal(log.args.activist, accounts[0]);
                assert.equal(log.args.candidate, accounts[log.logIndex]);
                assert.equal(log.args.vote_counter, 1)
            })
        });

        it('should increment counter', async function() {
            const VotingContract = artifacts.require('Voting');
            const instance = await VotingContract.deployed();
            const accounts = await web3.eth.getAccounts();


            let voteCounter1 = await instance.vote(accounts).then(receipt => receipt.logs[0].args.vote_counter.toNumber());

            let receipt2 = await instance.vote(accounts);

            receipt2.logs.forEach( log => {
                assert.equal(log.args.vote_counter.toNumber(), voteCounter1 + 1)
            })
        });
    });
});

