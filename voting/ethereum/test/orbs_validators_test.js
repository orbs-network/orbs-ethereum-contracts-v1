
const OrbsValidators = artifacts.require('OrbsValidators');
const harness = require('./harness');

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

            await harness.assertReject(instance.addValidator(harness.numToAddress(0)));
        });

        it('does not allow initializing with validator limit out of range', async () => {
            await harness.assertResolve(OrbsValidators.new(100));

            await harness.assertReject(OrbsValidators.new(101));
            await harness.assertReject(OrbsValidators.new(0));
        });

        it('enforces validator limit', async () => {
            const instance = await OrbsValidators.new(1);

            await instance.addValidator(harness.numToAddress(1));
            await harness.assertReject(instance.addValidator(harness.numToAddress(2)));
        });

        it('allows only owner to add validators', async () => {
            let instance = await OrbsValidators.deployed();
            await harness.assertReject(instance.addValidator(harness.numToAddress(22234), {from: accounts[1]}));
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

            await harness.assertResolve(instance.leave({from: accounts[1]})); // cleanup
        });

        it('should reject invalid input', async () => {
            let instance = await OrbsValidators.deployed();
            await instance.addValidator(accounts[0]);

            await harness.assertReject(instance.setValidatorData("", ip, url, orbsAddr));
            await harness.assertReject(instance.setValidatorData(undefined, ip, url, orbsAddr));

            await harness.assertResolve(instance.setValidatorData(name, ip, url, orbsAddr));

            await harness.assertReject(instance.setValidatorData(name, ip, "", orbsAddr));
            await harness.assertReject(instance.setValidatorData(name, ip, undefined, orbsAddr));

            await harness.assertResolve(instance.setValidatorData(name, ip, url, orbsAddr));

            await harness.assertReject(instance.setValidatorData(name, ip, url, "0x0"));
            await harness.assertReject(instance.setValidatorData(name, ip, url, undefined));

            await harness.assertResolve(instance.setValidatorData(name, ip, url, orbsAddr));
        });

        it('should reject duplicate entries', async () => {
            const instance = await OrbsValidators.deployed();

            const name2 = "another Name";
            const ip2 = [0,0,0,0];
            const url2 = "http://";
            const orbsAddr2 = harness.numToAddress(39567);

            await instance.addValidator(accounts[1]);
            await harness.assertResolve(instance.setValidatorData(name2, ip2, url2, orbsAddr2), 'expected default account to succeed in setting value set #2');
            await harness.assertResolve(instance.setValidatorData(name2, ip2, url2, orbsAddr2), 'expected setting the same values twice to succeed (duplicate values for same account)');
            await harness.assertResolve(instance.setValidatorData(name, ip, url, orbsAddr, {from: accounts[1]}), 'expected alternate account to receive value set #1');

            await harness.assertReject(instance.setValidatorData(name, ip2, url2, orbsAddr2), "expected setting another's name to fail");
            await harness.assertReject(instance.setValidatorData(name2, ip, url2, orbsAddr2), "expected setting another's ip to fail");
            await harness.assertReject(instance.setValidatorData(name2, ip2, url, orbsAddr2), "expected setting another's url to fail");
            await harness.assertReject(instance.setValidatorData(name2, ip2, url2, orbsAddr), "expected setting another's orbsAddress to fail");
        });

        it('should fail if called by non validator', async () => {
            let instance = await OrbsValidators.deployed();
            await instance.leave();
            await harness.assertReject(instance.setValidatorData(name, ip, url, orbsAddr));
        });

        it('should reject an ip address longer than 4 bytes', async () => {
            let instance = await OrbsValidators.deployed();

            await instance.addValidator(accounts[0]);
            await harness.assertResolve(instance.setValidatorData(name, "0x0102030400000000000000", url, orbsAddr));

            await harness.assertReject(instance.setValidatorData(name, "0x0102030400000000000001", url, orbsAddr));
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
});