

module.exports.verifyEtherBalance = async function (web3, targetAccount, minBalance, bankAccount) {
    const bufferBn = web3.utils.toBN(web3.utils.toWei("0.4", "ether"));

    const initial = await web3.eth.getBalance(targetAccount);
    const minBalanceBn = web3.utils.toBN(minBalance);
    const initialBn = web3.utils.toBN(initial);
    if (initialBn.gte(minBalanceBn)) {
        console.error(`verified balance for ${targetAccount} is at least ${minBalance} (${initial})`);
        return;
    }

    const diff = minBalanceBn.add(bufferBn).sub(initialBn).toString();
    console.error(`insufficient balance for ${targetAccount} transferring: ${diff}...`);

    await web3.eth.sendTransaction({to:targetAccount, from:bankAccount, value:diff});
    console.error(`new balance: ${await web3.eth.getBalance(targetAccount)}`);
};