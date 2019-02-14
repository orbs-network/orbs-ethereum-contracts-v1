
const VotingContract = artifacts.require('Voting');

const activist = "0x0000000000000000000000000000000000000001";

contract('Voting', accounts => {
    describe('when calling the vote() function', () => {
        it('should emit one Vote event', async () => {
            let instance = await VotingContract.deployed();

            let receipt = await instance.vote(accounts);

            let e = receipt.logs[0];
            assert.equal(e.event, "Vote");
            assert.equal(e.args.activist, accounts[0]);
            assert.equal(e.args.vote_counter, 1);
            assert.deepEqual(e.args.candidates, accounts);
        });

        it('should increment vote_counter', async () => {
            let instance = await VotingContract.deployed();

            let receipt1 = await instance.vote(accounts);
            let receipt2 = await instance.vote(accounts);

            let getCounter = receipt => receipt.logs[0].args.vote_counter.toNumber();

            assert.deepEqual(getCounter(receipt1) + 1, getCounter(receipt2))
        });
    });

    describe('when calling the delegate() function', () => {
        it('should emit one Delegate event', async () => {
            let instance = await VotingContract.deployed();

            let receipt = await instance.delegate(activist);

            let e = receipt.logs[0];
            assert.equal(e.event, "Delegate");
            assert.equal(e.args.stakeholder, accounts[0]);
            assert.equal(e.args.activist, activist);
            assert.equal(e.args.delegation_counter, 1);
        });

        it('should increment delegation_counter', async () => {
            let instance = await VotingContract.deployed();

            let receipt1 = await instance.delegate(activist);
            let receipt2 = await instance.delegate(activist);

            let getCounter = receipt => receipt.logs[0].args.delegation_counter.toNumber();

            assert.deepEqual(getCounter(receipt1) + 1, getCounter(receipt2))
        });
    });
});

