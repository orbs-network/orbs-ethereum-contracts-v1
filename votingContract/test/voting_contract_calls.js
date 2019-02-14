const assert = require('assert');
describe('Voting Contract', () => {
    let VotingContract;
    let activist;
    let instance;
    let accounts;

    before(async () => {
        VotingContract = artifacts.require('Voting');
        activist = "0x0000000000000000000000000000000000000001";
        instance = await VotingContract.deployed();
        accounts = await web3.eth.getAccounts();
    });

    describe('when calling the vote() function', () => {
        it('should emit one Vote event', async () => {
            const receipt = await instance.vote(accounts);
            const e = receipt.logs[0];

            assert.equal(e.event, "Vote");
            assert.equal(e.args.activist, accounts[0]);
            assert.equal(e.args.vote_counter, 1);
            assert.equal(JSON.stringify(e.args.candidates), JSON.stringify(accounts));
        });

        it('should increment vote_counter', async () => {
            const instance = await VotingContract.deployed();
            const accounts = await web3.eth.getAccounts();

            let counter1 = await instance.vote(accounts).then(receipt => receipt.logs[0].args.vote_counter.toNumber());
            let counter2 = await instance.vote(accounts).then(receipt => receipt.logs[0].args.vote_counter.toNumber());

            assert.equal(counter2, counter1 + 1)

        });
    });

    describe('when calling the delegate() function', () => {
        it('should emit one Delegate event', async () => {
            const receipt = await instance.delegate(activist);
            const e = receipt.logs[0];

            assert.equal(e.event, "Delegate");
            assert.equal(e.args.stakeholder, accounts[0]);
            assert.equal(e.args.activist, activist);
            assert.equal(e.args.delegation_counter, 1);
        });

        it('should increment delegation_counter', async () => {
            let counter1 = await instance.delegate(activist).then(receipt => receipt.logs[0].args.delegation_counter.toNumber());
            let counter2 = await instance.delegate(activist).then(receipt => receipt.logs[0].args.delegation_counter.toNumber());

            assert.equal(counter2, counter1 + 1);
        });
    });
});

