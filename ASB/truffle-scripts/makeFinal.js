function moveTimeBy(seconds, callback) {
    web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_increaseTime',
        params: [seconds],
        id: new Date().getSeconds()
    }, callback)
}

function mine(blocks, callback) {
    web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getSeconds()
    }, err => {
        if (err) {
            console.log(err);
            callback(err);
        } else if (blocks === 0) {
            callback()
        } else {
            mine(blocks - 1, callback)
        }
    })
}

module.exports = async function(done) {
    try {
        moveTimeBy(90, err => {
            if (!err) {
                mine(10, done);
            } else {
                console.log(err);
                done(err);

            }
        });

    } catch (e) {
        console.log(e);
        done(e);
    }
};
