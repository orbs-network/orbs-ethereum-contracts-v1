
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

        });

        it('should reject empty data entries', async () => {
            await driver.deployGuardians();

        });

        it('override existing records', async () => {
            await driver.deployGuardians();

        });

    });

    describe('when calling the getGuardianData() function', () => {
        it('should fail for unknown guardian addresses', async () => {
            await driver.deployGuardians();

        });
    });

    describe('when calling the getGuardians() function', () => {
        it('should return the requested page', async () => {
            await driver.deployGuardians();

        });
    });

    describe('when calling the leave() function', () => {
        it('should fail if sender is not a guardian', async () => {
            await driver.deployGuardians();

        });
    });
});
