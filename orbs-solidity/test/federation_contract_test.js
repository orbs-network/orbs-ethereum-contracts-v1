
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
        it('should add the member to the list', async () => {
            let instance = await FederationContract.deployed();
            await instance.addMember(member);

            let member1 = await instance.members(0);
            assert.equal(member1, member);

        });

        it('should allow only the owner to add a member', async () => {
            if (accounts.length < 2) {
                return // skip if there are no non owner accounts
            }
            let instance = await FederationContract.deployed();
            await instance.addMember(neverDeployedMember, {from: accounts[1]}).then(()=>{
                assert.fail("expected calling addMember using a non owner account will fail")
            }, err => {
                // we expect the error - do nothing
            })
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
});

