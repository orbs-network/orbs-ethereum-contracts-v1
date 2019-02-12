const Web3 = require('web3');

function createConnection(isMain) {
    return isMain ? createMainnet() : createRopsten();
}

function createMainnet() {
    // Instantiate web3 with WebSocketProvider
    return new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws'));
}

function createRopsten() {
    // Instantiate web3 with WebSocketProvider
    //const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ropsten.infura.io//ws'));
    //const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws'))

    return new Web3(new Web3.providers.HttpProvider('http://13.209.220.37:8545/'));
}

async function createContract(web3, abi, address) {
    // Instantiate contract object with JSON ABI and address
    let contractObj = await new web3.eth.Contract(abi, address);

    // debug
    let name = await contractObj.methods.name().call();
    console.log(`name ${name}\n`);

    return contractObj;
}

module.exports = {
    createConnection,
    createContract,
};
