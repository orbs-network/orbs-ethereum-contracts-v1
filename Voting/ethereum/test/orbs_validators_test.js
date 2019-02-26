
const OrbsValidators = artifacts.require('OrbsValidators');
const harness = require('./harness');

const REJECTED = "REJECTED";

contract('OrbsValidators', accounts => {
    describe('when calling the addValidator() function', () => {
        it('should add the member to the list and emit event', async () => {
            let instance = await OrbsValidators.deployed();
            const validatorAddr  = harness.numToAddress(1);

            let r = await instance.addValidator(validatorAddr);
            assert.equal(r.logs[0].event, "ValidatorAdded");

            let member1 = await instance.members(0);
            assert.equal(member1, validatorAddr);
        });

        it('should not allow address 0', async () => {
            let instance = await OrbsValidators.deployed();
            let result = await instance.addValidator(harness.numToAddress(0)).catch(() => {return REJECTED});
            assert.equal(result, REJECTED);
        });
    });

    describe('when calling the getValidators() function', () => {
        it('should return all members', async () => {
            let instance = await OrbsValidators.deployed();
            const validatorAddr  = harness.numToAddress(1);

            let members = await instance.getValidators();
            assert.lengthOf(members, 1);

            members = await instance.getValidators();

            assert.lengthOf(members, 1);
            assert.equal(members[0], validatorAddr)
        });
    });

    describe('when calling the isValidator() function', () => {
        it('should return true for registered validators and false to unknown validators', async () => {
            let instance = await OrbsValidators.deployed();
            const validatorAddr  = harness.numToAddress(1);
            const nonValidatorAddr  = harness.numToAddress(894);

            assert.isOk(await instance.isValidator(validatorAddr));
            assert.isNotOk(await instance.isValidator(nonValidatorAddr));

        });
    });

    describe('when calling the leave() function', () => {
        it('should fail for non member but succeed when called by a member', async () => {
            let instance = await OrbsValidators.deployed();

            await instance.addValidator(accounts[0]);
            assert.isOk(await instance.isValidator(accounts[0]));

            let r1 = await instance.leave();
            assert.equal(r1.logs[0].event, "ValidatorLeft");

            assert.isNotOk(await instance.isValidator(accounts[0]));

            let validatorsBefore = await instance.getValidators();
            let r2 = await instance.leave();
            assert.lengthOf(r2.logs, 0, "expected Left log to not occur when non-member tries to leave");

            let validatorsAfter = await instance.getValidators();
            assert.deepEqual(validatorsAfter, validatorsBefore, "expected members to not change");
        });

        it('should emit event', async () => {
            let instance = await OrbsValidators.deployed();

            await instance.addValidator(accounts[0]);

            let r = await instance.leave();
            assert.equal(r.logs[0].event, "ValidatorLeft");
        });
    });

    describe('when msg.sender is not the owner', () => {
        it('should be reflected in Ownable methods', async () => {
            let instance = await OrbsValidators.deployed();

            let owner = await instance.owner.call();
            assert.equal(owner, accounts[0]);

            assert.isOk(await instance.isOwner());
            await instance.renounceOwnership();

            assert.isNotOk(await instance.isOwner());
            assert.equal(await instance.owner.call(), harness.numToAddress(0));
        });

        it('disallows adding members', async () => {
            let instance = await OrbsValidators.deployed();
            let result = await instance.addValidator(harness.numToAddress(2)).catch(() => {return REJECTED});
            assert.equal(result, REJECTED)
        });
    });

    describe('failsafe constant MAX_FEDERATION_MEMBERS', () => { //warning: not testing enforcement of MAX_FEDERATION_MEMBERS. only that there is a constant with the correct value
        it('should be 100', async () => {
            let instance = await OrbsValidators.deployed();

            assert.equal((await instance.MAX_FEDERATION_MEMBERS()).toNumber(), 100, "expect a constant called MAX_FEDERATION_MEMBERS to euqal to 100 ");
            assert.equal(instance.abi.find(element => element.name == 'MAX_FEDERATION_MEMBERS').constant, true, "expected MAX_FEDERATION_MEMBERS to be declared as constant");
        });
    });
});