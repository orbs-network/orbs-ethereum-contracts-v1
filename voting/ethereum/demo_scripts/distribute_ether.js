

module.exports = async function(done) { // give some ether to secondary addresses from default address
    try {
        const accounts = await web3.eth.getAccounts();
        for (let i = 1; i < accounts.length; i++) {
            let value = web3.utils.toWei("0.1", "ether");
            await web3.eth.sendTransaction({to:accounts[i], from:accounts[0], value:value});
            console.log("transfered " + value + " from " + accounts[0] + " to " + accounts[i]);
        }
    } catch (e) {
        console.log(e);
    }
    done();
};
