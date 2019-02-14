const assert = require('assert');
describe('Voting Contract', function() {
    const VotingContract = artifacts.require('Voting');

    describe('when calling the vote() function', function() {
        it('should emit one Vote event', async function() {
            const instance = await VotingContract.deployed();
            const accounts = await web3.eth.getAccounts();

            const receipt = await instance.vote(accounts);
            const e = receipt.logs[0];

            assert.equal(e.event, "Vote");
            assert.equal(e.args.activist, accounts[0]);
            assert.equal(e.args.vote_counter, 1);
            assert.equal(JSON.stringify(e.args.candidates), JSON.stringify(accounts));
        });

        it('should increment vote_counter', async function() {
            const instance = await VotingContract.deployed();
            const accounts = await web3.eth.getAccounts();

            let counter1 = await instance.vote(accounts).then(receipt => receipt.logs[0].args.vote_counter.toNumber());
            let counter2 = await instance.vote(accounts).then(receipt => receipt.logs[0].args.vote_counter.toNumber());

            assert.equal(counter2, counter1 + 1)

        });
    });
});

