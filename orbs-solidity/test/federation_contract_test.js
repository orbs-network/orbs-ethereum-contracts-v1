
const FederationContract = artifacts.require('Federation');


const member  = "0x0000000000000000000000000000000000000001";
const neverDeployedMember = "0x0000000000000000000000000000000000000002";


contract('Federation', accounts => {
    it('should be ownable', async () => {
        let instance = await FederationContract.deployed();

        let owner = await instance.owner.call();

        assert.equal(owner, accounts[0]);
        assert.isOk(await instance.isOwner({from: accounts[0]}));
        if (accounts.length > 1) {
            assert.isNotOk(await instance.isOwner({from: accounts[1]}))
        }

    });

    describe('when calling the addMember() function', () => {
        it('should add the member to the list and emit event', async () => {
            let instance = await FederationContract.deployed();
            await instance.addMember(member).then(receipt =>{
                assert.equal(receipt.logs[0].event, "MemberAdded");
            });

            let member1 = await instance.members(0);
            assert.equal(member1, member);

        });

        it('should allow only the owner to add a member', async () => {
            if (accounts.length < 2) {
                return // skip if there are no non owner accounts
            }
            let instance = await FederationContract.deployed();
            await instance.addMember(neverDeployedMember, {from: accounts[1]}).then(()=>{
                assert.fail("calling addMember using a non owner account should fail")
            }).catch(()=>{}); // we expect an error - suppress error and proceed with test
        });
    });

    describe('when calling the getCurrentMembers() function', () => {
        it('should return all members', async () => {
            let instance = await FederationContract.deployed();
            let members = await instance.getCurrentMembers.call();

            assert.lengthOf(members, 1);
            assert.equal(members[0], member)
        });
    });

    describe('when calling the leave() function', () => {
        if (accounts.length < 4) {
            return
        }
        it('should fail for non member but succeed when called by a member', async () => {
            let instance = await FederationContract.deployed();

            await instance.addMember(accounts[2]);

            let members = await instance.getCurrentMembers();
            assert.include(members, accounts[2]);
            let membersLengthWithElement = members.length;

            await instance.leave({from: accounts[3]}).then(r => {
                assert.lengthOf(r.logs, 0, "expected Left log to occur when non-member tries to leave");
            });

            await instance.getCurrentMembers().then(newMembers => {
                assert.deepEqual(newMembers, members, "expected members to not change")
            });

            await instance.leave({from: accounts[2]}).then(r => {
                assert.equal(r.logs[0].event, "MemberLeft")
            });

            members = await instance.getCurrentMembers();
            assert.notInclude(members, accounts[2]);
            assert.lengthOf(members, membersLengthWithElement -1);
        });

        it('should emit event', async () => {
            let instance = await FederationContract.deployed();

            await instance.addMember(accounts[2]);

            await instance.leave({from: accounts[2]}).then(r => {
                assert.equal(r.logs[0].event, "MemberLeft")
            });
        });
    });
});

