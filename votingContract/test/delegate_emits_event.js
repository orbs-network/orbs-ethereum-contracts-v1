const assert = require('assert');
describe('Voting Contract', async function() {
    const VotingContract = artifacts.require('Voting');
    const activist = "0x0000000000000000000000000000000000000001";
    const instance = await VotingContract.deployed();
    const accounts = await web3.eth.getAccounts();
    describe('delegate',  function() {
        it('should emit event', async function() {

            let receipt = await instance.delegate(activist);

            assert.equal(receipt.logs[0].event, "Delegated");
            assert.equal(receipt.logs[0].args.stakeholder, accounts[0]);
            assert.equal(receipt.logs[0].args.activist, activist);
            assert.equal(receipt.logs[0].args.delegation_counter, 1);
        });


        it('should increment counter', async function() {
            const VotingContract = artifacts.require('Voting');
            let instance = await VotingContract.deployed();

            let counter1 = await instance.delegate(activist).then(receipt => receipt.logs[0].args.delegation_counter.toNumber());
            let counter2 = await instance.delegate(activist).then(receipt => receipt.logs[0].args.delegation_counter.toNumber());

            assert.equal(counter2, counter1 + 1);
        });
    });
});