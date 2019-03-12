

module.exports.verifyEtherBalance = async function (web3, targetAccount, minBalance, bankAccount) {
    const BUFFER = web3.utils.toWei("0.4", "ether");

    const initial = await web3.eth.getBalance(targetAccount);
    if (web3.utils.toBN(initial).gte(web3.utils.toBN(minBalance))) {
        console.error(`verified balance for ${targetAccount} is at least ${minBalance} (${initial})`);
        return;
    }

    const diff = web3.utils.toBN(minBalance + BUFFER).sub(web3.utils.toBN(initial)).toString();
    console.error(`insufficient balance for ${targetAccount} transferring: ${diff}...`);

    await web3.eth.sendTransaction({to:targetAccount, from:bankAccount, value:diff});
    console.error(`new balance: ${await web3.eth.getBalance(targetAccount)}`);
};