/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */


const {Driver, numToAddress} = require('./driver');
const {assertResolve, assertReject} = require('./assertExtensions');

contract('OrbsValidators', accounts => {
    let driver;

    beforeEach(() => {
        driver = new Driver();
    });

    describe('is not payable', () => {
        it('rejects payments', async () => {
            await driver.deployValidators(100);
            await assertReject(web3.eth.sendTransaction({
                to: driver.OrbsValidators.address,
                from: accounts[0],
                value: 1
            }), "expected payment to fail");
            assert(await web3.eth.getBalance(accounts[0]) >= 1, "expected main account to have wei");
        });
    });

    describe('when calling the approve() function', () => {
        it('should add the member to the list and emit event', async () => {
            await driver.deployValidators(100);

            const validatorAddr  = numToAddress(1);
            let r = await driver.OrbsValidators.approve(validatorAddr);
            assert.equal(r.logs[0].event, "ValidatorApproved");

            let approved = await driver.OrbsValidators.isApproved(validatorAddr);
            assert.isOk(approved);
        });

        it('should not allow address 0', async () => {
            await driver.deployValidators(100);
            await assertReject(driver.OrbsValidators.approve(numToAddress(0)));
        });

        it('does not allow initializing with validator limit out of range', async () => {
            await driver.deployValidators(100);

            await assertReject(driver.deployValidators(101));
            await assertReject(driver.deployValidators(0));
        });

        it('enforces validator limit', async () => {
            await driver.deployValidators(1);

            await assertResolve(driver.OrbsValidators.approve(numToAddress(1)));
            await assertReject(driver.OrbsValidators.approve(numToAddress(2)));
        });

        it('allows only owner to add validators', async () => {
            await driver.deployValidators(100);
            await assertReject(driver.OrbsValidators.approve(numToAddress(22234), {from: accounts[1]}));
        });
    });

    describe('when calling getAdditionBlockNumber() function', () => {
        it('returns the block height when the validator was last added, or 0 if never added', async () => {
            await driver.deployValidatorsWithRegistry(100);

            const zeroBlockNumber = await driver.OrbsValidators.getApprovalBlockNumber(accounts[0]);
            assert.equal(zeroBlockNumber, 0, "expected addition block height to be 0 before addition");

            const additionResult = await driver.OrbsValidators.approve(accounts[0]);
            const additionBlockNumber = additionResult.receipt.blockNumber;

            const blockNumber = await driver.OrbsValidators.getApprovalBlockNumber(accounts[0]);
            assert.equal(blockNumber, additionBlockNumber, "expected addition block height to reflect the block height of addition tx");
        });
    });

    describe('when fetching all Validators', () => {
        [
            "getValidators",
            "getValidatorsBytes20"
        ].forEach((validatorGetterFunctionName) => {

            context(`with ${validatorGetterFunctionName}()`, async () => {
                let functionUnderTest;
                beforeEach(async () => {
                    await driver.deployValidatorsWithRegistry(100);
                    functionUnderTest = driver.OrbsValidators[validatorGetterFunctionName];
                });

                it('should return all validators with set data', async () => {
                    let members = await functionUnderTest();
                    assert.lengthOf(members, 0);

                    const validatorAddr1  = accounts[1];
                    const validatorAddr2  = accounts[2];

                    await driver.approveAndRegister(validatorAddr1);
                    await driver.approveAndRegister(validatorAddr2);

                    members = await functionUnderTest()

                    assert.deepEqual(members.map(a => web3.utils.toChecksumAddress(a)), [validatorAddr1, validatorAddr2]);
                });
            });
        });
    });

    describe('when calling the isValidator() function', () => {
        it('should return true for listed validators and false to unknown validators', async () => {
            await driver.deployValidatorsWithRegistry(100);
            const validatorAddr  = accounts[3];
            const nonValidatorAddr  = numToAddress(894);

            await driver.approveAndRegister(validatorAddr);

            assert.isOk(await driver.OrbsValidators.isValidator(validatorAddr));
            assert.isNotOk(await driver.OrbsValidators.isValidator(nonValidatorAddr));
        });
    });

    describe('when calling the remove() function', () => {
        it('should fail for non owner but succeed for owner', async () => {
            await driver.deployValidatorsWithRegistry(100);

            await driver.approveAndRegister(accounts[1]); // add validator and set data
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[1]));

            await assertReject(driver.OrbsValidators.remove(accounts[1], {from: accounts[1]}), "expected failure when called by non owner");
            const r1 = await driver.OrbsValidators.remove(accounts[1]); // owner tx
            assert.equal(r1.logs[0].event, "ValidatorRemoved");
            assert.isNotOk(await driver.OrbsValidators.isValidator(accounts[1]));

            await assertResolve(driver.OrbsValidators.approve(accounts[2])); // add validator but don't set data
            const r2 = await driver.OrbsValidators.remove(accounts[2]);
            assert.equal(r2.logs[0].event, "ValidatorRemoved");

            await assertReject(driver.OrbsValidators.remove(accounts[7]), "expected failure when called with unknown validator");
        });

        it('fails if not by owner', async () => {
            await driver.deployValidatorsWithRegistry(100);

            await driver.OrbsValidators.approve(accounts[0]);

            const r = await driver.OrbsValidators.remove(accounts[0]);
            assert.equal(r.logs[0].event, "ValidatorRemoved");
        });

        it('clears addition block height', async () => {
            await driver.deployValidatorsWithRegistry(100);

            await driver.OrbsValidators.approve(accounts[0]);

            await driver.OrbsValidators.remove(accounts[0]);
            const blockNumber = await driver.OrbsValidators.getApprovalBlockNumber(accounts[0]);
            assert.equal(blockNumber, 0, "expected addition block height to be cleared after removal");
        });

        it('removes only the correct validator', async () => {
            await driver.deployValidatorsWithRegistry(100);

            await driver.approveAndRegister(accounts[1]); // add validator and set data
            await driver.approveAndRegister(accounts[2]); // add validator and set data
            await driver.approveAndRegister(accounts[3]); // add validator and set data
            await driver.approveAndRegister(accounts[4]); // add validator and set data
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[1]));
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[2]));
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[3]));
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[4]));

            const validatorsBeforeRemove = (await driver.OrbsValidators.getValidators()).map(raw => web3.utils.toChecksumAddress(raw));
            assert.deepEqual(validatorsBeforeRemove, [accounts[1], accounts[2], accounts[3], accounts[4]]);

            // remove in the middle
            const r1 = await driver.OrbsValidators.remove(accounts[2]);
            assert.equal(r1.logs[0].event, "ValidatorRemoved");

            assert.isOk(await driver.OrbsValidators.isValidator(accounts[1]));
            assert.isNotOk(await driver.OrbsValidators.isValidator(accounts[2]));
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[3]));
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[4]));

            const validatorsAfterRemove1 = (await driver.OrbsValidators.getValidators()).map(raw => web3.utils.toChecksumAddress(raw));
            assert.deepEqual(validatorsAfterRemove1, [accounts[1], accounts[4], accounts[3]]);

            // remove first
            const r2 = await driver.OrbsValidators.remove(accounts[1]);
            assert.equal(r2.logs[0].event, "ValidatorRemoved");

            assert.isNotOk(await driver.OrbsValidators.isValidator(accounts[1]));
            assert.isNotOk(await driver.OrbsValidators.isValidator(accounts[2]));
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[3]));
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[4]));

            const validatorsAfterRemove2 = (await driver.OrbsValidators.getValidators()).map(raw => web3.utils.toChecksumAddress(raw));
            assert.deepEqual(validatorsAfterRemove2, [accounts[3], accounts[4]]);

            // remove last
            const r3 = await driver.OrbsValidators.remove(accounts[4]);
            assert.equal(r3.logs[0].event, "ValidatorRemoved");

            assert.isNotOk(await driver.OrbsValidators.isValidator(accounts[1]));
            assert.isNotOk(await driver.OrbsValidators.isValidator(accounts[2]));
            assert.isOk(await driver.OrbsValidators.isValidator(accounts[3]));
            assert.isNotOk(await driver.OrbsValidators.isValidator(accounts[4]));

            const validatorsAfterRemove3 = (await driver.OrbsValidators.getValidators()).map(raw => web3.utils.toChecksumAddress(raw));
            assert.deepEqual(validatorsAfterRemove3, [accounts[3]]);
        });
    });

    describe('when getNetworkTopology() is called', () => {
        it('should return the all the addresses of validators that were set', async () => {
            await driver.deployValidatorsWithRegistry(100);

            let addresses = [numToAddress(12345), numToAddress(6789), numToAddress(34657)];
            let ips = ["0xaabbccdd", "0x11223344", "0x1122AAFF"];

            await assertResolve(driver.OrbsValidators.approve(accounts[0]));
            await assertResolve(driver.OrbsValidators.approve(accounts[1])); // decoy - this guy never sets his data
            await assertResolve(driver.OrbsValidators.approve(accounts[2]));

            await driver.OrbsRegistry.register("test0", ips[0], "url0", addresses[0], {from: accounts[0]});
            await driver.OrbsRegistry.register("test1", ips[1], "url1", addresses[1], {from: accounts[2]});
            await driver.OrbsRegistry.register("test2", ips[2], "url2", addresses[2], {from: accounts[3]}); // decoy - this guy was never approved

            const networkTopology = await driver.OrbsValidators.getNetworkTopology();

            assert.equal(networkTopology.nodeAddresses.length, 2, "expected network topology to include two validators");
            assert.deepEqual(networkTopology.nodeAddresses, [addresses[0], addresses[1]], "expected the array of addresses to return");
            assert.deepEqual(networkTopology.ipAddresses,  [ips[0], ips[1]], "expected the array of ips to return");
        });
    });

    describe('when isApproved() is called', () => {
        it('should return iff validator is currently approved', async () => {
            await driver.deployValidators(100);

            assert.isNotOk(await driver.OrbsValidators.isApproved(accounts[4]), "expected validator to not be approved before it was approved");

            await assertResolve(driver.OrbsValidators.approve(accounts[4]));

            assert.isOk(await driver.OrbsValidators.isApproved(accounts[4]), "expected validator to  be approved after it was approved");

            await assertResolve(driver.OrbsValidators.remove(accounts[4]));

            assert.isNotOk(await driver.OrbsValidators.isApproved(accounts[4]), "expected validator to not be approved after it was removed");
        });
    });
});