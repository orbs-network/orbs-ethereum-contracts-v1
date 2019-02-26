const Web3 = require('web3');

const networkConnectionUrl = process.env.NETWORK_URL_ON_ETHEREUM;
const votingContractAddress = process.env.VOTING_CONTRACT_ADDRESS;
const startBlock = process.env.START_BLOCK_ON_ETHEREUM;
const endBlock = process.env.END_BLOCK_ON_ETHEREUM;
const VOTING_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"nodes_list","type":"address[]"},{"indexed":false,"name":"vote_counter","type":"uint256"}],"name":"Vote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegation_counter","type":"uint256"}],"name":"Delegate","type":"event"},{"constant":false,"inputs":[{"name":"nodes_list","type":"address[]"}],"name":"vote","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}];
/*const VOTING_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "vote_counter",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function",
        "signature": "0xcab1e244"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "delegation_counter",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function",
        "signature": "0xf28583cd"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "activist",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "candidates",
                "type": "address[]"
            },
            {
                "indexed": false,
                "name": "vote_counter",
                "type": "uint256"
            }
        ],
        "name": "Vote",
        "type": "event",
        "signature": "0x8e74707f33682297df744388ec6b7a56c219db104289e482dd949ba15f80213d"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "stakeholder",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "activist",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "delegation_counter",
                "type": "uint256"
            }
        ],
        "name": "Delegate",
        "type": "event",
        "signature": "0x510b11bb3f3c799b11307c01ab7db0d335683ef5b2da98f7697de744f465eacc"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "candidates",
                "type": "address[]"
            }
        ],
        "name": "vote",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "signature": "0xed081329"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "activist",
                "type": "address"
            }
        ],
        "name": "delegate",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "signature": "0x5c19a95c"
    }
];
*/
async function getAllPastDelegateEvents(tokenContract) {
    let options = {
        fromBlock: startBlock,
        toBlock: endBlock
    };

    let mapOfTransfers = {};
    let listOfTransfers = [];
    try {
        let events = await tokenContract.getPastEvents('Delegate', options);
        for (let i = events.length-1; i >= 0;i--) {
            let event = events[i];
            let delegatorAddress = getAddressFromTopic(event, TOPIC_FROM_ADDR);
            let currentDelegateIndex = mapOfTransfers[delegatorAddress];
            if (typeof currentDelegateIndex === 'number' && isObjectNewerThanTx(listOfTransfers[currentDelegateIndex], event) ) {
                continue;
            }
            let obj = generateDelegateObject(event.blockNumber, event.transactionIndex, event.transactionHash, delegatorAddress, getAddressFromTopic(event, TOPIC_TO_ADDR), event.event);

            if(typeof currentDelegateIndex === 'number') {
                listOfTransfers[currentDelegateIndex] = obj;
            } else {
                mapOfTransfers[delegatorAddress] = listOfTransfers.length;
                listOfTransfers.push(obj);
            }
        }
        return listOfTransfers;
    } catch (error) {
        console.log(error);
        return [];
    }
}

const TOPIC_FROM_ADDR = 1;
const TOPIC_TO_ADDR = 2;
function getAddressFromTopic(event, i) {
    let topic = event.raw.topics[i];
    return '0x' + topic.substring(26)
}

function isObjectNewerThanTx(latestDelegate, event) {
    return latestDelegate.block > event.blockNumber ||
        (latestDelegate.block > event.blockNumber && latestDelegate.transactionIndex > event.transactionIndex)
}

function generateDelegateObject(block, transactionIndex, txHash, delegatorAddress, delegateeAddress, method) {
    return {
        block, transactionIndex, txHash, delegatorAddress, delegateeAddress, method
    }
}

async function main() {
    let web3 = await new Web3(new Web3.providers.HttpProvider(networkConnectionUrl));
    let contract = await new web3.eth.Contract(VOTING_ABI, votingContractAddress);
     return await getAllPastDelegateEvents(contract);
}

main()
    .then(results => {
        console.log(JSON.stringify(results, null, 2));
    }).catch(console.error);
