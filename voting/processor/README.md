
## setup orbs (gammacli)

* setup orbs-gamma-config.json with the environment(s) you want

## setup enviroment

NETWORK_URL_ON_ETHEREUM=http://localhost:7545/
ERC20_CONTRACT_ADDRESS=0x5B31Ea29271Cc0De13E17b67a8f94Dd0b8F4B959
VOTING_CONTRACT_ADDRESS=0x201e10E4Fa7f232F93c387928d3e453030e59166
START_BLOCK_ON_ETHEREUM=500000
END_BLOCK_ON_ETHEREUM=latest
NETWORK_URL_ON_ORBS=1
ORBS_VOTING_CONTRACT_NAME=local

optional 
VERBOSE      - if set it will cause more verbose output  



## run
node mirror.js
