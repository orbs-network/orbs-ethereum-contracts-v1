
const guardiansContractAddress = process.env.GUARDIANS_CONTRACT_ADDRESS;
const guardianAccountIndexesOnEthereum = process.env.GUARDIAN_ACCOUNT_INDEXES_ON_ETHEREUM;

module.exports = async function (done) {
    try {

        if (!guardiansContractAddress) {
            throw("missing env variable GUARDIANS_CONTRACT_ADDRESS");
        }

        if (!guardianAccountIndexesOnEthereum) {
            throw("missing env variable GUARDIAN_ACCOUNT_INDEXES_ON_ETHEREUM");
        }

        const guardiansInstance = await artifacts.require('IOrbsGuardians').at(guardiansContractAddress);

        let accounts = await web3.eth.getAccounts();
        let guardianIndexes = JSON.parse(guardianAccountIndexesOnEthereum);
        let guardians = guardianIndexes.map(elem => accounts[elem]);

        let txs = guardians.map((address, i) => {
            return guardiansInstance.isGuardian(address).then((guardian)=>{
                if (guardian) {
                    let balanceBefore;
                    return web3.eth.getBalance(address).then((initialBalance)=> {
                        balanceBefore = initialBalance;
                    }).then(()=>{
                        return guardiansInstance.leave({from: address}).then(async () => {
                            const balanceAfter = await web3.eth.getBalance(address);
                            console.error(`Guardian #${i} left. new balance: ${balanceAfter} wei (recovered ${balanceAfter - balanceBefore} wei)`);
                        });
                    });
                } else {
                    console.error(`Guardian #${i} was not registered. Skipping...`);
                }
            });
        });

        await Promise.all(txs);

        done();

    } catch
        (e) {
        console.log(e);
        done(e);
    }
}
;
