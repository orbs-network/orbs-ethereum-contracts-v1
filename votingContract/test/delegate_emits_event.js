const assert = require('assert');
describe('Voting Contract', async function() {
    const VotingContract = artifacts.require('Voting');
    const activist = "0x0000000000000000000000000000000000000001";
    const instance = await VotingContract.deployed();
    const accounts = await web3.eth.getAccounts();

    describe('when calling the delegate() function',  function() {
        it('should emit one Delegate event', async function() {

            const receipt = await instance.delegate(activist);
            const e = receipt.logs[0];

            assert.equal(e.event, "Delegate");
            assert.equal(e.args.stakeholder, accounts[0]);
            assert.equal(e.args.activist, activist);
            assert.equal(e.args.delegation_counter, 1);
        });

        it('should increment delegation_counter', async function() {

            let counter1 = await instance.delegate(activist).then(receipt => receipt.logs[0].args.delegation_counter.toNumber());
            let counter2 = await instance.delegate(activist).then(receipt => receipt.logs[0].args.delegation_counter.toNumber());

            assert.equal(counter2, counter1 + 1);
        });
    });
});