const Web3 = require('web3');

const networkConnectionUrl = process.env.NETWORK_URL_ON_ETHEREUM;
const erc20ContractAddress = process.env.ERC20_CONTRACT_ADDRESS;
const startBlock = process.env.START_BLOCK_ON_ETHEREUM;
const endBlock = process.env.END_BLOCK_ON_ETHEREUM;
const TOKEN_ABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "spender",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "from",
                "type": "address"
            },
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "spender",
                "type": "address"
            },
            {
                "name": "addedValue",
                "type": "uint256"
            }
        ],
        "name": "increaseAllowance",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "spender",
                "type": "address"
            },
            {
                "name": "subtractedValue",
                "type": "uint256"
            }
        ],
        "name": "decreaseAllowance",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "owner",
                "type": "address"
            },
            {
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_account",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "assign",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

async function getAllPastTransferEvents(tokenContract) {
    let options = {
        fromBlock: startBlock,
        toBlock: endBlock
        // fromBlock: currentBlock-100000,
        // toBlock: currentBlock-100
//        fromBlock: 4985940,//currentBlock-2000,
//        toBlock: 4985941//currentBlock-1999
    };

    // debug
    //console.log(`from ${options.fromBlock} to ${options.toBlock}`);

    let mapOfTransfers = {};
    let listOfTransfers = [];
    try {
        let events = await tokenContract.getPastEvents('Transfer', options);
//        console.log(events.length);
        for (let i = events.length-1; i >= 0;i--) {
            let event = events[i];
            //console.log(event);
            //           console.log(`found ${event.blockNumber} ${event.returnValues['0']} ${event.returnValues['1']} ${event.raw.data}`);
            if (isTransferADelegateAction(event)) { // its the right amount
//                console.log(event);
                let delegatorAddress = getAddressFromTopic(event, TOPIC_FROM_ADDR);//event.returnValues['0'];
                let currentDelegateIndex = mapOfTransfers[delegatorAddress];
//                console.log(`${i} ${delegatorAddress} ${currentDelegateIndex} ${event.blockNumber} ${event.transactionIndex} ${JSON.stringify(event.returnValues, null, 2)}`)
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
        }

        // debug
        // console.log(`found ${events.length} events of which ${listOfTransfers.length} are delegation transfers`);
        // for (let transfer of listOfTransfers) {
        //     console.log(transfer);
        // }
        return listOfTransfers;
    } catch (error) {
        console.log(error);
        return [];
    }
}

function isTransferADelegateAction(event) {
    return event.raw.data === '0x0000000000000000000000000000000000000000000000000000000000000007';
 //   return IS_MAIN_NET
 //       ? event.raw.data === '0x0000000000000000000000000000000000000000000000000000000000000007'
 //       : event.raw.data === '0x0000000000000000000000000000000000000000000000000000000002faf080' //true
 //       ;
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
//        Block: block, TxHash: txHash, DelegatorAddress: delegatorAddress, DelegateeAddress: delegateeAddress, Medthod: method
        block, transactionIndex, txHash, delegatorAddress, delegateeAddress, method
    }
}

//module.exports = async function() {
async function main() {
    let web3 = await new Web3(new Web3.providers.HttpProvider(networkConnectionUrl));
    let tokenContract = await new web3.eth.Contract(TOKEN_ABI, erc20ContractAddress);

    // debug
//    let currentBlock = await web3.eth.getBlockNumber();
    //console.log(tokenContract);
//    console.log(`Connected to ${networkConnectionUrl} current block ${currentBlock}`);

    // return [
    //     {
    //         Block: 5006450,
    //         TxHash: '0xbe7cf40127b9504364d3237b1c75a347213258140f3ae49c337743b21d178979',
    //         DelegatorAddress: '0xFC378dAA952ba7f163c4a11628f55a4df523b3EF',
    //         DelegateeAddress: '0xf91DB2F257B4df352Cf4479A1d59511d34A3c08C',
    //         Method: 'Transfer'
    //     },
    //     {
    //         Block: 5006450,
    //         TxHash: '0xbe7cf40127b9504364d3237b1c75a347213258140f3ae49c337743b21d178979',
    //         DelegatorAddress: '0xFC378dAA952ba7f163c4a11628f55a4df523b3EF',
    //         DelegateeAddress: '0xf91DB2F257B4df352Cf4479A1d59511d34A3c08C',
    //         Method: 'Transfer'
    //     }
    // ];
    //
     return await getAllPastTransferEvents(tokenContract);
};

main()
    .then(results => {
        console.log(JSON.stringify(results, null, 2));
    }).catch(console.error);
