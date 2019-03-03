
const OrbsValidators = artifacts.require('OrbsValidators');
const driver = require('./driver');
const assertResolve = require('./assertExtensions').assertResolve;
const assertReject = require('./assertExtensions').assertReject;

contract('OrbsValidators', accounts => {
    describe('when calling the addValidator() function', () => {
        it('should add the member to the list and emit event', async () => {
            let instance = await OrbsValidators.new(100);
            const validatorAddr  = driver.numToAddress(1);

            let r = await instance.addValidator(validatorAddr);
            assert.equal(r.logs[0].event, "ValidatorAdded");

            let member1 = await instance.validators(0);
            assert.equal(member1, validatorAddr);
        });

        it('should not allow address 0', async () => {
            let instance = await OrbsValidators.new(100);

            await assertReject(instance.addValidator(driver.numToAddress(0)));
        });

        it('does not allow initializing with validator limit out of range', async () => {
            await assertResolve(OrbsValidators.new(100));

            await assertReject(OrbsValidators.new(101));
            await assertReject(OrbsValidators.new(0));
        });

        it('enforces validator limit', async () => {
            const instance = await OrbsValidators.new(1);

            await instance.addValidator(driver.numToAddress(1));
            await assertReject(instance.addValidator(driver.numToAddress(2)));
        });

        it('allows only owner to add validators', async () => {
            let instance = await OrbsValidators.new(100);
            await assertReject(instance.addValidator(driver.numToAddress(22234), {from: accounts[1]}));
        });

    });

    describe('when calling the getValidators() function', () => {
        it('should return all validators with set data', async () => {
            let instance = await OrbsValidators.new(100);

            let members = await instance.getValidators();
            assert.lengthOf(members, 0);

            const validatorAddr1  = accounts[1];
            const validatorAddr2  = accounts[2];

            await driver.addValidatorWithData(instance, validatorAddr1);
            await driver.addValidatorWithData(instance, validatorAddr2);

            members = await instance.getValidators();

            assert.deepEqual(members, [validatorAddr1, validatorAddr2]);
        });
    });

    describe('when calling the isValidator() function', () => {
        it('should return true for listed validators and false to unknown validators', async () => {
            let instance = await OrbsValidators.new(100);
            const validatorAddr  = accounts[3];
            const nonValidatorAddr  = driver.numToAddress(894);

            await driver.addValidatorWithData(instance, validatorAddr);

            assert.isOk(await instance.isValidator(validatorAddr));
            assert.isNotOk(await instance.isValidator(nonValidatorAddr));
        });
    });

    describe('when calling the leave() function', () => {
        it('should fail for non member but succeed when called by a member', async () => {
            let instance = await OrbsValidators.new(100);

            await driver.addValidatorWithData(instance, accounts[1]); // add validator and set data
            assert.isOk(await instance.isValidator(accounts[1]));

            let r1 = await instance.leave({from: accounts[1]});
            assert.equal(r1.logs[0].event, "ValidatorLeft");
            assert.isNotOk(await instance.isValidator(accounts[1]));

            await assertResolve(instance.addValidator(accounts[3])); // add validator but don't set data
            let r2 = await instance.leave({from: accounts[3]});
            assert.equal(r2.logs[0].event, "ValidatorLeft");

            let validatorsBefore = await instance.getValidators();
            let r3 = await instance.leave();
            assert.lengthOf(r3.logs, 0, "expected Left log to not occur when non-member tries to leave");

            let validatorsAfter = await instance.getValidators();
            assert.deepEqual(validatorsAfter, validatorsBefore, "expected members to not change");
        });

        it('should emit event', async () => {
            let instance = await OrbsValidators.new(100);

            await instance.addValidator(accounts[0]);

            let r = await instance.leave();
            assert.equal(r.logs[0].event, "ValidatorLeft");
        });
    });

    describe('when setValidatorData() is called', () => {
        const name = "somename";
        const url = "http://somedomain.com/";
        const orbsAddr = driver.numToAddress(8765);
        const ip = "0x01020304"; // 4 bytes representing an address

        describe('and then getValidatorData() is called', () => {
            it('should return the entry', async () => {
                let instance = await OrbsValidators.new(100);

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

                await assertResolve(instance.leave({from: accounts[1]})); // cleanup
            });
        });

        it('should reject invalid input', async () => {
            let instance = await OrbsValidators.new(100);
            await instance.addValidator(accounts[0]);

            await assertReject(instance.setValidatorData("", ip, url, orbsAddr));
            await assertReject(instance.setValidatorData(undefined, ip, url, orbsAddr));

            await assertResolve(instance.setValidatorData(name, ip, url, orbsAddr));

            await assertReject(instance.setValidatorData(name, ip, "", orbsAddr));
            await assertReject(instance.setValidatorData(name, ip, undefined, orbsAddr));

            await assertResolve(instance.setValidatorData(name, ip, url, orbsAddr));

            await assertReject(instance.setValidatorData(name, ip, url, "0x0"));
            await assertReject(instance.setValidatorData(name, ip, url, undefined));

            await assertResolve(instance.setValidatorData(name, ip, url, orbsAddr));
        });

        it('should reject duplicate entries', async () => {
            const instance = await OrbsValidators.deployed();

            const name2 = "another Name";
            const ip2 = [0,0,0,0];
            const url2 = "http://";
            const orbsAddr2 = driver.numToAddress(39567);

            await instance.addValidator(accounts[0]);
            await assertResolve(instance.setValidatorData(name, ip, url, orbsAddr, {from: accounts[0]}), 'expected one account to receive value set #1');

            await instance.addValidator(accounts[1]);
            await assertResolve(instance.setValidatorData(name2, ip2, url2, orbsAddr2, {from: accounts[1]}), 'expected default account to succeed in setting value set #2');
            await assertResolve(instance.setValidatorData(name2, ip2, url2, orbsAddr2, {from: accounts[1]}), 'expected setting the same values twice to succeed (duplicate values for same account)');

            await assertReject(instance.setValidatorData(name, ip2, url2, orbsAddr2, {from: accounts[1]}), "expected setting another's name to fail");
            await assertReject(instance.setValidatorData(name2, ip, url2, orbsAddr2, {from: accounts[1]}), "expected setting another's ip to fail");
            await assertReject(instance.setValidatorData(name2, ip2, url, orbsAddr2, {from: accounts[1]}), "expected setting another's url to fail");
            await assertReject(instance.setValidatorData(name2, ip2, url2, orbsAddr, {from: accounts[1]}), "expected setting another's orbsAddress to fail");
        });

        it('should fail if called by non validator', async () => {
            let instance = await OrbsValidators.new(100);
            await instance.leave();
            await assertReject(instance.setValidatorData(name, ip, url, orbsAddr));
        });

        it('should reject an ip address longer than 4 bytes', async () => {
            let instance = await OrbsValidators.new(100);

            await assertResolve(instance.addValidator(accounts[0]));
            await assertResolve(instance.setValidatorData(name, "0x0102030400000000000000", url, orbsAddr));

            await assertReject(instance.setValidatorData(name, "0x0102030400000000000001", url, orbsAddr));
        });
    });

    describe('when getValidatorData() is called', () => {
        it('should return an error if no data was previously set', async () => {
            let instance = await OrbsValidators.new(100);

            await assertResolve(instance.addValidator(accounts[0]));
            await assertReject(instance.getValidatorData(accounts[0]));
        });
    });

    describe('when getOrbsAddress() is called', () => {
        it('should return the last address set, or an error if no data was set', async () => {
            let instance = await OrbsValidators.new(100);

            const orbsAddress = driver.numToAddress(12345);

            await assertResolve(instance.addValidator(accounts[0]));
            await assertReject(instance.getOrbsAddress(accounts[0]));

            await instance.setValidatorData("test", "0xaabbccdd", "url", orbsAddress);
            const fetchedAddress = await instance.getOrbsAddress(accounts[0]);

            assert.equal(fetchedAddress, orbsAddress, "expected fetched address to match the last one set");
        });
    });

    describe('when getNetworkTopology() is called', () => {
        it('should return the all the addresses of validators that were set', async () => {
            let instance = await OrbsValidators.new(100);

            let addresses = [driver.numToAddress(12345), driver.numToAddress(6789)];
            let ips = ["0xaabbccdd", "0x11223344"];


            await assertResolve(instance.addValidator(accounts[0]));
            await assertResolve(instance.addValidator(accounts[1])); // decoy - this guy never sets its data
            await assertResolve(instance.addValidator(accounts[2]));

            // set data only for the first and the last
            await instance.setValidatorData("test0", ips[0], "url0", addresses[0], {from: accounts[0]});
            await instance.setValidatorData("test1", ips[1], "url1", addresses[1], {from: accounts[2]});

            const networkTopology = await instance.getNetworkTopology();

            assert(networkTopology.nodeAddresses.length !== 3, "expected network topology to exclude added validators  with no data set");
            assert.deepEqual(networkTopology.nodeAddresses, addresses, "expected the array of addresses to return");
            assert.deepEqual(networkTopology.ipAddresses, ips, "expected the array of ips to return");
        });
    });
});