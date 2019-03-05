
const {Driver} = require('./driver');
const {assertResolve, assertReject} = require('./assertExtensions');


contract('OrbsGuardians', accounts => {
    let driver;

    beforeEach(() => {
        driver = new Driver();
    });

    describe('when calling the register() function', () => {
        it('should reflect registration in calls to: getGuardianData(), isGuardian(), getGuardians()', async () => {
            await driver.deployGuardians();

            await assertReject(driver.OrbsGuardians.getGuardianData(accounts[1]), "expected getting data before registration to fail");
            assert.isNotOk(await driver.OrbsGuardians.isGuardian(accounts[1]), "expected isGuardian to return false before registration");
            assert.deepEqual(await driver.OrbsGuardians.getGuardians(0, 10), [], "expected an empty guardian list before registration");

            await driver.OrbsGuardians.register("some name", "some website", {from: accounts[1]});

            const retrievedData = await driver.OrbsGuardians.getGuardianData(accounts[1]);
            assert.equal(retrievedData.name, "some name", "expected correct name to be returned");
            assert.equal(retrievedData.website, "some website", "expected correct website to be returned");
            assert.equal(retrievedData[0], retrievedData.name, "expected name to be returned as first argument");
            assert.equal(retrievedData[1], retrievedData.website, "expected website to be returned as second argument");

            assert.isOk(await driver.OrbsGuardians.isGuardian(accounts[1]), "expected isGuardian to return true after registration");

            const retrievedGuardianList = await driver.OrbsGuardians.getGuardians(0, 10);
            assert.deepEqual(retrievedGuardianList, [accounts[1]], "expected list with the registered account address");
        });

        it('should reject empty data entries', async () => {
            await driver.deployGuardians();

            await assertReject(driver.OrbsGuardians.register("", "some website", {from: accounts[1]}), "expected empty name to fail registration");
            await assertReject(driver.OrbsGuardians.register(undefined, "some website", {from: accounts[1]}), "expected undefined name to fail registration");

            await assertReject(driver.OrbsGuardians.register("some name", "", {from: accounts[1]}), "expected empty website to fail registration");
            await assertReject(driver.OrbsGuardians.register("some name", undefined, {from: accounts[1]}), "expected undefined website to fail registration");
        });

        it('override existing records', async () => {
            await driver.deployGuardians();

            await driver.OrbsGuardians.register("some name", "some website", {from: accounts[1]});
            await driver.OrbsGuardians.register("other name", "other website", {from: accounts[1]});

            const retrievedData = await driver.OrbsGuardians.getGuardianData(accounts[1]);
            assert.equal(retrievedData.name, "other name", "expected name to be overridden");
            assert.equal(retrievedData.website, "other website", "expected website to be overridden");
        });

    });

    describe('when calling the getGuardianData() function', () => {
        it('should fail for unknown guardian addresses', async () => {
            await driver.deployGuardians();

            await driver.OrbsGuardians.register("some name", "some website", {from: accounts[1]}); // register one guardian

            await assertReject(driver.OrbsGuardians.getGuardianData(accounts[2]), "expected getting data for unknown guardian address to fail");
        });
    });

    describe('when calling the getGuardians() function', () => {
        it('returns an empty array if offset is out of range', async () => {
            await driver.deployGuardians();

            const empty1 = await driver.OrbsGuardians.getGuardians(0, 10);
            assert.deepEqual(empty1, [], "expected an empty array before anyone registered");

            // register one guardian
            await driver.OrbsGuardians.register("some name", "some website", {from: accounts[1]});

            const empty2 = await driver.OrbsGuardians.getGuardians(1, 10); // first unavailable offset
            assert.deepEqual(empty2, [], "expected an empty array when requested unavailable offset");

            const empty3 = await driver.OrbsGuardians.getGuardians(100, 10); // far unavailable offset
            assert.deepEqual(empty3, [], "expected an empty array when requested unavailable offset");
        });

        it('should return the requested page', async () => {
            await driver.deployGuardians();

            await driver.OrbsGuardians.register("some name", "some website", {from: accounts[1]});
            await driver.OrbsGuardians.register("some name", "some website", {from: accounts[2]});
            await driver.OrbsGuardians.register("some name", "some website", {from: accounts[3]});

            const fullList = await driver.OrbsGuardians.getGuardians(0, 10);
            assert.deepEqual(fullList, [accounts[1], accounts[2], accounts[3]], "expected three elements");

            const lastTwo = await driver.OrbsGuardians.getGuardians(1, 10);
            assert.deepEqual(lastTwo, [accounts[2], accounts[3]], "expected last two elements");

            const lastOne = await driver.OrbsGuardians.getGuardians(2, 10);
            assert.deepEqual(lastOne, [accounts[3]], "expected last element");

            const firstTwo = await driver.OrbsGuardians.getGuardians(0, 2);
            assert.deepEqual(firstTwo, [accounts[1], accounts[2]], "expected first two elements");

            const firstOne = await driver.OrbsGuardians.getGuardians(0, 1);
            assert.deepEqual(firstOne, [accounts[1]], "expected first element");

            const middle = await driver.OrbsGuardians.getGuardians(1, 1);
            assert.deepEqual(middle, [accounts[2]], "expected middle element");

            const empty = await driver.OrbsGuardians.getGuardians(1, 0);
            assert.deepEqual(empty, [], "expected empty list");
        });
    });

    describe('when calling the leave() function', () => {
        it('should fail if sender is not a guardian, and succeed if it is', async () => {
            await driver.deployGuardians();
            await assertReject(driver.OrbsGuardians.leave(), "expected leave to fail if not registered");

            await driver.OrbsGuardians.register("some name", "some website", {from: accounts[1]});
            await driver.OrbsGuardians.register("some name", "some website", {from: accounts[2]});
            await driver.OrbsGuardians.register("some name", "some website", {from: accounts[3]});

            await driver.OrbsGuardians.leave({from: accounts[1]});

            const remainingTwo = await driver.OrbsGuardians.getGuardians(0, 10);
            assert.deepEqual(remainingTwo, [accounts[3], accounts[2]], "expected three elements");

            await driver.OrbsGuardians.leave({from: accounts[2]});

            const remainingOne = await driver.OrbsGuardians.getGuardians(0, 10);
            assert.deepEqual(remainingOne, [accounts[3]], "expected three elements");

            await driver.OrbsGuardians.leave({from: accounts[3]});

            const noneLeft = await driver.OrbsGuardians.getGuardians(0, 10);
            assert.deepEqual(noneLeft, [], "expected an empty list after everyone left");
        });

    });
});