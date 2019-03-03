
const OrbsValidators = artifacts.require('OrbsValidators');
const {Driver, numToAddress} = require('./driver');
const {assertResolve, assertReject} = require('./assertExtensions');

contract('OrbsValidators', accounts => {
    let driver;

    beforeEach(() => {
        driver = new Driver();
    });

    describe('when calling the addValidator() function', () => {
        it('should add the member to the list and emit event', async () => {
            await driver.deployContracts(100);

            const validatorAddr  = numToAddress(1);
            let r = await driver.OrbsValidators.addValidator(validatorAddr);
            assert.equal(r.logs[0].event, "ValidatorAdded");

            let member1 = await driver.OrbsValidators.validators(0);
            assert.equal(member1, validatorAddr);
        });

        it('should not allow address 0', async () => {
            await driver.deployContracts(100);
            await assertReject(driver.OrbsValidators.addValidator(numToAddress(0)));
        });

        it('does not allow initializing with validator limit out of range', async () => {
            await driver.deployContracts(100);

            await assertReject(driver.deployContracts(101));
            await assertReject(driver.deployContracts(0));
        });

        it('enforces validator limit', async () => {
            await driver.deployContracts(1);

            await assertResolve(driver.OrbsValidators.addValidator(numToAddress(1)));
            await assertReject(driver.OrbsValidators.addValidator(numToAddress(2)));
        });

        it('allows only owner to add validators', async () => {
            await driver.deployContracts(100);
            await assertReject(driver.OrbsValidators.addValidator(numToAddress(22234), {from: accounts[1]}));
        });

    });

    describe('when calling the getValidators() function', () => {
        it('should return all validators with set data', async () => {
            await driver.deployContracts(100);

            let members = await driver.OrbsValidators.getValidators();
            assert.lengthOf(members, 0);

            const validatorAddr1  = accounts[1];
            const validatorAddr2  = accounts[2];

            await driver.addValidatorWithData(validatorAddr1);
            await driver.addValidatorWithData(validatorAddr2);

            members = await driver.OrbsValidators.getValidators();

            assert.deepEqual(members, [validatorAddr1, validatorAddr2]);
        });
    });

    describe('when calling the isValidator() function', () => {
        it('should return true for listed validators and false to unknown validators', async () => {
            await driver.deployContracts(100);
            const validatorAddr  = accounts[3];
            const nonValidatorAddr  = numToAddress(894);

            await driver.addValidatorWithData(validatorAddr);

            assert.isOk(await driver.OrbsValidators.isValidator(validatorAddr));
            assert.isNotOk(await driver.OrbsValidators.isValidator(nonValidatorAddr));
        });
    });

    describe('when calling the leave() function', () => {
        it('should fail for non member but succeed when called by a member', async () => {
            await driver.deployContracts(100);

            await driver.addValidatorWithData(accounts[1]); // add validator and set data
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[1]));

            let r1 = await driver.OrbsValidators.leave({from: accounts[1]});
            assert.equal(r1.logs[0].event, "ValidatorLeft");
            assert.isNotOk(await driver.OrbsValidators.isValidator(accounts[1]));

            await assertResolve(driver.OrbsValidators.addValidator(accounts[3])); // add validator but don't set data
            let r2 = await driver.OrbsValidators.leave({from: accounts[3]});
            assert.equal(r2.logs[0].event, "ValidatorLeft");

            let validatorsBefore = await driver.OrbsValidators.getValidators();
            let r3 = await driver.OrbsValidators.leave();
            assert.lengthOf(r3.logs, 0, "expected Left log to not occur when non-member tries to leave");

            let validatorsAfter = await driver.OrbsValidators.getValidators();
            assert.deepEqual(validatorsAfter, validatorsBefore, "expected members to not change");
        });

        it('should emit event', async () => {
            await driver.deployContracts(100);

            await driver.OrbsValidators.addValidator(accounts[0]);

            let r = await driver.OrbsValidators.leave();
            assert.equal(r.logs[0].event, "ValidatorLeft");
        });
    });

    describe('when register() is called', () => {
        const name = "somename";
        const url = "http://somedomain.com/";
        const orbsAddr = numToAddress(8765);
        const ip = "0x01020304"; // 4 bytes representing an address

        describe('and then getValidatorData() is called', () => {
            it('should return the entry', async () => {
                await driver.deployContracts(100);

                await driver.OrbsValidators.addValidator(accounts[1]);
                await driver.OrbsValidators.register(name, ip, url, orbsAddr, {from: accounts[1]});
                let result = await driver.OrbsValidators.getValidatorData(accounts[1]);

                assert.equal(result._name, name);
                assert.equal(result._ipvAddress, ip);
                assert.equal(result._website, url);
                assert.equal(result._orbsAddress, orbsAddr);
                assert.equal(result._name, result[0]);
                assert.equal(result._ipvAddress, result[1]);
                assert.equal(result._website, result[2]);
                assert.equal(result._orbsAddress, orbsAddr);

                await assertResolve(driver.OrbsValidators.leave({from: accounts[1]})); // cleanup
            });
        });

        it('should reject invalid input', async () => {
            await driver.deployContracts(100);
            await driver.OrbsValidators.addValidator(accounts[0]);

            await assertReject(driver.OrbsValidators.register("", ip, url, orbsAddr));
            await assertReject(driver.OrbsValidators.register(undefined, ip, url, orbsAddr));

            await assertResolve(driver.OrbsValidators.register(name, ip, url, orbsAddr));

            await assertReject(driver.OrbsValidators.register(name, ip, "", orbsAddr));
            await assertReject(driver.OrbsValidators.register(name, ip, undefined, orbsAddr));

            await assertResolve(driver.OrbsValidators.register(name, ip, url, orbsAddr));

            await assertReject(driver.OrbsValidators.register(name, ip, url, "0x0"));
            await assertReject(driver.OrbsValidators.register(name, ip, url, undefined));

            await assertResolve(driver.OrbsValidators.register(name, ip, url, orbsAddr));
        });

        it('should reject duplicate entries', async () => {
            await driver.deployContracts(100);

            const name2 = "another Name";
            const ip2 = [0,0,0,0];
            const url2 = "http://";
            const orbsAddr2 = numToAddress(39567);

            await driver.OrbsValidators.addValidator(accounts[0]);
            await assertResolve(driver.OrbsValidators.register(name, ip, url, orbsAddr, {from: accounts[0]}), 'expected one account to receive value set #1');

            await driver.OrbsValidators.addValidator(accounts[1]);
            await assertResolve(driver.OrbsValidators.register(name2, ip2, url2, orbsAddr2, {from: accounts[1]}), 'expected default account to succeed in setting value set #2');
            await assertResolve(driver.OrbsValidators.register(name2, ip2, url2, orbsAddr2, {from: accounts[1]}), 'expected setting the same values twice to succeed (duplicate values for same account)');

            await assertReject(driver.OrbsValidators.register(name, ip2, url2, orbsAddr2, {from: accounts[1]}), "expected setting another's name to fail");
            await assertReject(driver.OrbsValidators.register(name2, ip, url2, orbsAddr2, {from: accounts[1]}), "expected setting another's ip to fail");
            await assertReject(driver.OrbsValidators.register(name2, ip2, url, orbsAddr2, {from: accounts[1]}), "expected setting another's url to fail");
            await assertReject(driver.OrbsValidators.register(name2, ip2, url2, orbsAddr, {from: accounts[1]}), "expected setting another's orbsAddress to fail");
        });

        it('should fail if called by non validator', async () => {
            await driver.deployContracts(100);
            await driver.OrbsValidators.leave();
            await assertReject(driver.OrbsValidators.register(name, ip, url, orbsAddr));
        });

        it('should reject an ip address longer than 4 bytes', async () => {
            await driver.deployContracts(100);

            await assertResolve(driver.OrbsValidators.addValidator(accounts[0]));
            await assertResolve(driver.OrbsValidators.register(name, "0x0102030400000000000000", url, orbsAddr));

            await assertReject(driver.OrbsValidators.register(name, "0x0102030400000000000001", url, orbsAddr));
        });
    });

    describe('when getValidatorData() is called', () => {
        it('should return an error if no data was previously set', async () => {
            await driver.deployContracts(100);

            await assertResolve(driver.OrbsValidators.addValidator(accounts[0]));
            await assertReject(driver.OrbsValidators.getValidatorData(accounts[0]));
        });
    });

    describe('when getOrbsAddress() is called', () => {
        it('should return the last address set, or an error if no data was set', async () => {
            await driver.deployContracts(100);

            const orbsAddress = numToAddress(12345);

            await assertResolve(driver.OrbsValidators.addValidator(accounts[0]));
            await assertReject(driver.OrbsValidators.getOrbsAddress(accounts[0]));

            await driver.OrbsValidators.register("test", "0xaabbccdd", "url", orbsAddress);
            const fetchedAddress = await driver.OrbsValidators.getOrbsAddress(accounts[0]);

            assert.equal(fetchedAddress, orbsAddress, "expected fetched address to match the last one set");
        });
    });

    describe('when getNetworkTopology() is called', () => {
        it('should return the all the addresses of validators that were set', async () => {
            await driver.deployContracts(100);

            let addresses = [numToAddress(12345), numToAddress(6789)];
            let ips = ["0xaabbccdd", "0x11223344"];


            await assertResolve(driver.OrbsValidators.addValidator(accounts[0]));
            await assertResolve(driver.OrbsValidators.addValidator(accounts[1])); // decoy - this guy never sets its data
            await assertResolve(driver.OrbsValidators.addValidator(accounts[2]));

            // set data only for the first and the last
            await driver.OrbsValidators.register("test0", ips[0], "url0", addresses[0], {from: accounts[0]});
            await driver.OrbsValidators.register("test1", ips[1], "url1", addresses[1], {from: accounts[2]});

            const networkTopology = await driver.OrbsValidators.getNetworkTopology();

            assert(networkTopology.nodeAddresses.length !== 3, "expected network topology to exclude added validators  with no data set");
            assert.deepEqual(networkTopology.nodeAddresses, addresses, "expected the array of addresses to return");
            assert.deepEqual(networkTopology.ipAddresses, ips, "expected the array of ips to return");
        });
    });
});