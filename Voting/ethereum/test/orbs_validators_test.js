
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

            let member1 = await instance.validators(0);
            assert.equal(member1, validatorAddr);
        });

        it('should not allow address 0', async () => {
            let instance = await OrbsValidators.deployed();
            let result = await instance.addValidator(harness.numToAddress(0)).catch(() => REJECTED);
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
        it('should return true for listed validators and false to unknown validators', async () => {
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

    describe('when setValidatorData() is called', () => {
        const name = "somename";
        const url = "http://somedomain.com/";
        const orbsAddr = harness.numToAddress(8765);
        const ip = "0x01020304"; // 4 bytes representing an address

        it('should set data and return in using getValidatorData()', async () => {
            let instance = await OrbsValidators.deployed();

            await instance.addValidator(accounts[1]);
            await instance.setValidatorData(name, ip, url, orbsAddr, {from: accounts[1]});
            let result = await instance.getValidatorData(accounts[1]);

            assert.equal(result._name, name);
            assert.equal(result._ipvAddress, ip);
            assert.equal(result._website, url);
            assert.equal(result._orbsAddress, orbsAddr);
            assert.equal(result._name, result[0]);
            assert.equal(result._ipvAddress, result[1]);
            assert.equal(result._website, result[2]);
            assert.equal(result._orbsAddress, orbsAddr);

            result = await instance.leave({from: accounts[1]}).catch(() => REJECTED); // cleanup
            assert.notEqual(result, REJECTED);
        });

        it('should reject invalid input', async () => {
            let instance = await OrbsValidators.deployed();
            await instance.addValidator(accounts[0]);

            let result = await instance.setValidatorData("", ip, url, orbsAddr).catch(() => REJECTED);
            assert.equal(result, REJECTED);

            result = await instance.setValidatorData(undefined, ip, url, orbsAddr).catch(() => REJECTED);
            assert.equal(result, REJECTED);

            result = await instance.setValidatorData(name, ip, url, orbsAddr).catch(() => REJECTED);
            assert.notEqual(result, REJECTED);


            result = await instance.setValidatorData(name, ip, "", orbsAddr).catch(() => REJECTED);
            assert.equal(result, REJECTED);

            result = await instance.setValidatorData(name, ip, undefined, orbsAddr).catch(() => REJECTED);
            assert.equal(result, REJECTED);

            result = await instance.setValidatorData(name, ip, url, orbsAddr).catch(() => REJECTED);
            assert.notEqual(result, REJECTED);


            result = await instance.setValidatorData(name, ip, url, "0x0").catch(() => REJECTED);
            assert.equal(result, REJECTED);

            result = await instance.setValidatorData(name, ip, url, undefined).catch(() => REJECTED);
            assert.equal(result, REJECTED);

            result = await instance.setValidatorData(name, ip, url, orbsAddr).catch(() => REJECTED);
            assert.notEqual(result, REJECTED);
        });

        it('should reject duplicate entries', async () => {
            const instance = await OrbsValidators.deployed();

            const name2 = "another Name";
            const ip2 = [0,0,0,0];
            const url2 = "http://";
            const orbsAddr2 = harness.numToAddress(39567);

            await instance.addValidator(accounts[1]);
            const r1 = await instance.setValidatorData(name2, ip2, url2, orbsAddr2).catch(() => REJECTED);
            const r2 = await instance.setValidatorData(name2, ip2, url2, orbsAddr2).catch(() => REJECTED);
            const r3 = await instance.setValidatorData(name, ip, url, orbsAddr, {from: accounts[1]}).catch(() => REJECTED);
            assert.notEqual(r1, REJECTED, 'expected default account to succeed in setting value set #2');
            assert.notEqual(r2, REJECTED,'expected setting the same values twice to succeed (duplicate values for same account)');
            assert.notEqual(r3, REJECTED, 'expected alternate account to receive value set #1');

            const r4 = await instance.setValidatorData(name, ip2, url2, orbsAddr2).catch(() => REJECTED);
            const r5 = await instance.setValidatorData(name2, ip, url2, orbsAddr2).catch(() => REJECTED);
            const r6 = await instance.setValidatorData(name2, ip2, url, orbsAddr2).catch(() => REJECTED);
            const r7 = await instance.setValidatorData(name2, ip2, url2, orbsAddr).catch(() => REJECTED);
            assert.equal(r4, REJECTED, "expected setting another's name to fail");
            assert.equal(r5, REJECTED, "expected setting another's ip to fail");
            assert.equal(r6, REJECTED, "expected setting another's url to fail");
            assert.equal(r7, REJECTED, "expected setting another's orbsAddress to fail");
        });


        it('should fail if called by non validator', async () => {
            let instance = await OrbsValidators.deployed();
            await instance.leave();
            let result = await instance.setValidatorData(name, ip, url, orbsAddr).catch(() => REJECTED);
            assert.equal(result, REJECTED);
        });

        it('should reject an ip address longer than 4 bytes', async () => {
            let instance = await OrbsValidators.deployed();

            await instance.addValidator(accounts[0]);
            const r1 = await instance.setValidatorData(name, "0x0102030400000000000000", url, orbsAddr).catch((e) => {console.log(e); return REJECTED});
            assert.notEqual(r1, REJECTED);
            const r2 = await instance.setValidatorData(name, "0x0102030400000000000001", url, orbsAddr).catch(() => REJECTED);
            assert.equal(r2, REJECTED);
        });
    });

    describe('when getValidatorData() is called', () => {
        // TODO fill
    });

    describe('when getOrbsAddress() is called', () => {
        // TODO fill
    });

    describe('when getNetworkTopology() is called', () => {
        // TODO fill
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
            let result = await instance.addValidator(harness.numToAddress(2)).catch(() => REJECTED);
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