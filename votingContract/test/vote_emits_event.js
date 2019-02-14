const assert = require('assert');
describe('Voting Contract', async function() {

    describe('vote', function() {
        it('should emit events', async function() {
            const VotingContract = artifacts.require('Voting');
            const instance = await VotingContract.deployed();
            const accounts = await web3.eth.getAccounts();


            let receipt = await instance.vote(accounts);

            assert.equal(receipt.logs[0].event, "Vote")
            assert.equal(receipt.logs[0].args.activist, accounts[0]);
            assert.equal(receipt.logs[0].args.vote_counter, 1)

            assert.equal(receipt.logs[0].args.candidates.length, accounts.length);
            receipt.logs[0].args.candidates.forEach((candidate, i) => {
                assert.equal(candidate, accounts[i])
            })
        });

        it('should increment counter', async function() {
            const VotingContract = artifacts.require('Voting');
            const instance = await VotingContract.deployed();
            const accounts = await web3.eth.getAccounts();


            let voteCounter1 = await instance.vote(accounts).then(receipt => receipt.logs[0].args.vote_counter.toNumber());

            let receipt2 = await instance.vote(accounts);

            assert.equal(receipt2.logs[0].args.vote_counter.toNumber(), voteCounter1 + 1)

        });
    });
});

