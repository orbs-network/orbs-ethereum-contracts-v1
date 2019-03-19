
const {Driver, numToAddress} = require('./driver');
const {assertResolve, assertReject} = require('./assertExtensions');

contract('OrbsValidatorsRegistry', accounts => {
    let driver;

    beforeEach(() => {
        driver = new Driver();
    });


    describe('is not payable', () => {
        it('rejects payments', async () => {
            await driver.deployRegistry();
            await assertReject(web3.eth.sendTransaction({
                to: driver.OrbsRegistry.address,
                from: accounts[0],
                value: 1
            }), "expected payment to fail");
            assert(await web3.eth.getBalance(accounts[0]) >= 1, "expected main account to have wei");
        });
    });

    describe('when calling the isValidator() function', () => {
        it('should return true iff previously registered', async () => {
            await driver.deployRegistry();
            const validatorAddr  = accounts[3];
            const nonValidatorAddr = numToAddress(894);

            await driver.register(validatorAddr);

            assert.isOk(await driver.OrbsRegistry.isValidator(validatorAddr));
            assert.isNotOk(await driver.OrbsRegistry .isValidator(nonValidatorAddr));
        });
    });

    describe('when calling the leave() function', () => {
        it('should emit event or fail for non members', async () => {
            await driver.deployRegistry();

            await driver.register(accounts[1]);
            assert.isOk(await driver.OrbsRegistry.isValidator(accounts[1]));

            let r1 = await driver.OrbsRegistry.leave({from: accounts[1]});
            assert.equal(r1.logs[0].event, "ValidatorLeft", "expected leaving to emit event");
            assert.isNotOk(await driver.OrbsRegistry.isValidator(accounts[1]), "expected leaving to be reflected in isValidator");

            await assertReject(driver.OrbsRegistry.leave({from: accounts[1]}), "expected leave to fail after leaving once");
            await assertReject(driver.OrbsRegistry.getValidatorData(accounts[1]), "expected getValidatorData to fail after leaving");
            await assertReject(driver.OrbsRegistry.getOrbsAddress(accounts[1]), "expected getOrbsAddress to fail after leaving");
        });
    });

    describe('when register() is called', () => {
        const name = "somename";
        const url = "http://somedomain.com/";
        const orbsAddr = numToAddress(8765);
        const ip = "0x01020304"; // 4 bytes representing an address

        describe('and then getValidatorData() is called', () => {
            it('should return the entry', async () => {
                await driver.deployRegistry();

                await driver.OrbsRegistry.register(name, ip, url, orbsAddr, {from: accounts[1]});
                const valData = await driver.OrbsRegistry.getValidatorData(accounts[1]);

                assert.equal(valData.name, name);
                assert.equal(valData.ipAddress, ip);
                assert.equal(valData.website, url);
                assert.equal(valData.orbsAddress.toUpperCase(), orbsAddr.toUpperCase());
                assert.equal(valData.name, valData[0]);
                assert.equal(valData.ipAddress, valData[1]);
                assert.equal(valData.website, valData[2]);
                assert.equal(valData.orbsAddress, valData[3]);
            });
        });

        describe('and then getRegistrationBlockHeight() is called', () => {
            it('should return the correct the registration block height', async () => {
                await driver.deployRegistry();

                const regRes = await driver.OrbsRegistry.register(name, ip, url, orbsAddr, {from: accounts[1]});
                const regBlk = await driver.OrbsRegistry.getRegistrationBlockHeight(accounts[1]);

                const blockNumber = regRes.receipt.blockNumber;
                assert.equal(regBlk.registeredOn.toNumber(), blockNumber);
                assert.equal(regBlk.lastUpdatedOn.toNumber(), blockNumber);
                assert.equal(regBlk.registeredOn.toNumber(), regBlk[0].toNumber());
                assert.equal(regBlk.lastUpdatedOn.toNumber(), regBlk[1].toNumber());
            });
        });

        it('should reject invalid input', async () => {
            await driver.deployRegistry();

            await assertReject(driver.OrbsRegistry.register("", ip, url, orbsAddr));
            await assertReject(driver.OrbsRegistry.register(undefined, ip, url, orbsAddr));

            await assertResolve(driver.OrbsRegistry.register(name, ip, url, orbsAddr));

            await assertReject(driver.OrbsRegistry.register(name, ip, "", orbsAddr));
            await assertReject(driver.OrbsRegistry.register(name, ip, undefined, orbsAddr));

            await assertResolve(driver.OrbsRegistry.register(name, ip, url, orbsAddr));

            await assertReject(driver.OrbsRegistry.register(name, ip, url, "0x0"));
            await assertReject(driver.OrbsRegistry.register(name, ip, url, undefined));

            await assertResolve(driver.OrbsRegistry.register(name, ip, url, orbsAddr));
        });

        it('should reject duplicate IP and Orbs Address only', async () => {
            await driver.deployRegistry();

            const name2 = "another Name";
            const ip2 = "0x01020305"; // 4 bytes such that ip2 != ip
            const url2 = "http://";
            const orbsAddr2 = numToAddress(39567);

            await assertResolve(driver.OrbsRegistry.register(name, ip, url, orbsAddr, {from: accounts[0]}), 'expected one account to receive value set #1');

            await assertResolve(driver.OrbsRegistry.register(name2, ip2, url2, orbsAddr2, {from: accounts[1]}), 'expected another account to succeed in setting value set #2');
            await assertResolve(driver.OrbsRegistry.register(name2, ip2, url2, orbsAddr2, {from: accounts[1]}), 'expected setting the same values twice to succeed (duplicate values for same account)');

            await assertResolve(driver.OrbsRegistry.register(name, ip2, url2, orbsAddr2, {from: accounts[1]}), "expected setting duplicate name to succeed");
            await assertResolve(driver.OrbsRegistry.register(name2, ip2, url, orbsAddr2, {from: accounts[1]}), "expected setting duplicate url to succeed");

            await assertReject(driver.OrbsRegistry.register(name2, ip2, url2, orbsAddr, {from: accounts[1]}), "expected setting duplicate orbsAddress to fail");
            await assertReject(driver.OrbsRegistry.register(name2, ip, url2, orbsAddr2, {from: accounts[1]}), "expected setting duplicate ip to fail");
        });

        it('should reject zero ip address longer than 4 bytes', async () => {
            await driver.deployRegistry();

            await assertReject(driver.OrbsRegistry.register(name,  "0x00000000", url, orbsAddr));
            await assertResolve(driver.OrbsRegistry.register(name, "0x01020304", url, orbsAddr));
        });

        describe('twice for the same validator', () => {
            it('should replace values and update updatedOnBlock', async () => {
                await driver.deployRegistry();

                await driver.OrbsRegistry.register("XX", "0xFFEEDDCC", "XX", numToAddress(999), {from: accounts[1]});
                await driver.OrbsRegistry.register(name, ip, url, orbsAddr, {from: accounts[1]});

                const valData = await driver.OrbsRegistry.getValidatorData(accounts[1]);
                assert.equal(valData.name, name);
                assert.equal(valData.ipAddress, ip);
                assert.equal(valData.website, url);
                assert.equal(valData.orbsAddress.toUpperCase(), orbsAddr.toUpperCase());
                assert.equal(valData.name, valData[0]);
                assert.equal(valData.ipAddress, valData[1]);
                assert.equal(valData.website, valData[2]);
                assert.equal(valData.orbsAddress, valData[3]);

            });

            it('returns correct block heights after a successful override', async () => {
                await driver.deployRegistry();

                const regRes1 = await driver.OrbsRegistry.register("XX", "0xFFEEDDCC", "XX", numToAddress(999), {from: accounts[1]});
                const regRes2 = await driver.OrbsRegistry.register(name, ip, url, orbsAddr, {from: accounts[1]});
                
                const regBlck = await driver.OrbsRegistry.getRegistrationBlockHeight(accounts[1]);
                const registrationHeight = regRes1.receipt.blockNumber;
                const updateHeight = regRes2.receipt.blockNumber;
                assert(registrationHeight < updateHeight, "expected registration block height to be less than updating block height");
                assert.equal(regBlck.registeredOn.toNumber(), registrationHeight);
                assert.equal(regBlck.lastUpdatedOn.toNumber(), updateHeight);
                assert.equal(regBlck.registeredOn.toNumber(), regBlck[0].toNumber());
                assert.equal(regBlck.lastUpdatedOn.toNumber(), regBlck[1].toNumber());
            });
        });
    });

    describe('when getValidatorData() is called', () => {
        it('should return an error if no data was previously set', async () => {
            await driver.deployRegistry();
            await assertReject(driver.OrbsRegistry.getValidatorData(accounts[0]));
        });
    });

    describe('when getOrbsAddress() is called', () => {
        it('should return the last address set, or an error if no data was set', async () => {
            await driver.deployRegistry();

            const orbsAddress = numToAddress(12345);

            await assertReject(driver.OrbsRegistry.getOrbsAddress(accounts[0]));

            await driver.OrbsRegistry.register("test", "0xaabbccdd", "url", orbsAddress);
            const fetchedAddress = await driver.OrbsRegistry.getOrbsAddress(accounts[0]);

            assert.equal(fetchedAddress, orbsAddress, "expected fetched address to match the value set");
        });
    });
});