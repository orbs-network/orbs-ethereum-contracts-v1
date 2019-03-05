
const {Driver, numToAddress} = require('./driver');
const {assertResolve, assertReject} = require('./assertExtensions');

contract('OrbsValidators', accounts => {
    let driver;

    beforeEach(() => {
        driver = new Driver();
    });

    describe('when calling the addValidator() function', () => {
        it('should add the member to the list and emit event', async () => {
            await driver.deployValidators(100);

            const validatorAddr  = numToAddress(1);
            let r = await driver.OrbsValidators.addValidator(validatorAddr);
            assert.equal(r.logs[0].event, "ValidatorAdded");

            let member1 = await driver.OrbsValidators.validators(0);
            assert.equal(member1, validatorAddr);
        });

        it('should not allow address 0', async () => {
            await driver.deployValidators(100);
            await assertReject(driver.OrbsValidators.addValidator(numToAddress(0)));
        });

        it('does not allow initializing with validator limit out of range', async () => {
            await driver.deployValidators(100);

            await assertReject(driver.deployValidators(101));
            await assertReject(driver.deployValidators(0));
        });

        it('enforces validator limit', async () => {
            await driver.deployValidators(1);

            await assertResolve(driver.OrbsValidators.addValidator(numToAddress(1)));
            await assertReject(driver.OrbsValidators.addValidator(numToAddress(2)));
        });

        it('allows only owner to add validators', async () => {
            await driver.deployValidators(100);
            await assertReject(driver.OrbsValidators.addValidator(numToAddress(22234), {from: accounts[1]}));
        });

    });

    describe('when calling the getValidators() function', () => {
        it('should return all validators with set data', async () => {
            await driver.deployValidatorsWithRegistry(100);

            let members = await driver.OrbsValidators.getValidators();
            assert.lengthOf(members, 0);

            const validatorAddr1  = accounts[1];
            const validatorAddr2  = accounts[2];

            await driver.addValidatorWithData(validatorAddr1);
            await driver.addValidatorWithData(validatorAddr2);

            members = await driver.OrbsValidators.getValidators();

            assert.deepEqual(members, [validatorAddr1.toLowerCase(), validatorAddr2.toLowerCase()]);
        });
    });

    describe('when calling the isValidator() function', () => {
        it('should return true for listed validators and false to unknown validators', async () => {
            await driver.deployValidatorsWithRegistry(100);
            const validatorAddr  = accounts[3];
            const nonValidatorAddr  = numToAddress(894);

            await driver.addValidatorWithData(validatorAddr);

            assert.isOk(await driver.OrbsValidators.isValidator(validatorAddr));
            assert.isNotOk(await driver.OrbsValidators.isValidator(nonValidatorAddr));
        });
    });

    describe('when calling the remove() function', () => {
        it('should fail for non owner but succeed for owner', async () => {
            await driver.deployValidatorsWithRegistry(100);

            await driver.addValidatorWithData(accounts[1]); // add validator and set data
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[1]));

            await assertReject(driver.OrbsValidators.remove({from: accounts[1]}), "expected failure when called by non owner");
            let r1 = await driver.OrbsValidators.remove(accounts[1]); // owner tx
            assert.equal(r1.logs[0].event, "ValidatorRemoved");
            assert.isNotOk(await driver.OrbsValidators.isValidator(accounts[1]));

            await assertResolve(driver.OrbsValidators.addValidator(accounts[2])); // add validator but don't set data
            let r2 = await driver.OrbsValidators.remove(accounts[2]);
            assert.equal(r2.logs[0].event, "ValidatorRemoved");

            await assertReject(driver.OrbsValidators.remove(accounts[7]), "expected failure when called with unknown validator");
        });

        it('fails if not by owner', async () => {
            await driver.deployValidatorsWithRegistry(100);

            await driver.OrbsValidators.addValidator(accounts[0]);

            let r = await driver.OrbsValidators.remove(accounts[0]);
            assert.equal(r.logs[0].event, "ValidatorRemoved");
        });
    });

    describe('when getNetworkTopology() is called', () => {
        it('should return the all the addresses of validators that were set', async () => {
            await driver.deployValidatorsWithRegistry(100);

            let addresses = [numToAddress(12345), numToAddress(6789)];
            let ips = ["0xaabbccdd", "0x11223344"];


            await assertResolve(driver.OrbsValidators.addValidator(accounts[0]));
            await assertResolve(driver.OrbsValidators.addValidator(accounts[1])); // decoy - this guy never sets its data
            await assertResolve(driver.OrbsValidators.addValidator(accounts[2]));

            // set data only for the first and the last
            await driver.OrbsRegistry.register("test0", ips[0], "url0", addresses[0], {from: accounts[0]});
            await driver.OrbsRegistry.register("test1", ips[1], "url1", addresses[1], {from: accounts[2]});

            const networkTopology = await driver.OrbsValidators.getNetworkTopology();

            assert(networkTopology.nodeAddresses.length !== 3, "expected network topology to exclude added validators  with no data set");
            assert.deepEqual(networkTopology.nodeAddresses, addresses, "expected the array of addresses to return");
            assert.deepEqual(networkTopology.ipAddresses, ips, "expected the array of ips to return");
        });
    });
});