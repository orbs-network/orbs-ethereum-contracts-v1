### Pre-Requisutes:

* Install go: `brew install go`
* Install node and yarn: `brew install node`
* Install ganache: https://truffleframework.com/ganache
* Install docker: https://docs.docker.com/v17.12/docker-for-mac/install
* Install gamma-cli: `brew install orbs-network/devtools/gamma-cli`
* Install project by running in terminal: `npm install` 
* For Ropsten: 
    * Make sure ROPSTEN_SECRET and ROPSTEN_URL are set
* For Ethereum Mainnet: 
    * Make sure MAINNET_SECRET and MAINNET_URL are set
* For Ganache: 
    * To Override localhost set GANACHE_URL
* Run:
```
> mkdir -p build/contracts && cp ../../build/ethereum/* build/contracts/
> ./node_modules/.bin/truffle compile --all
> cd ../../processor/ && npm install && cd -
```

* Set Ganache > Settings > Accounts & Keys > Total Accounts To Generate = 25

### Execute Test:

`> ./test_full.sh -env [local|experimantal|ropsten|mainnet]`

#### local/experimental
These two modes run on the local machine.
before launching the test make sure to start gamma-cli with the matching -env modifier, and launch Ganache. 
Ganache must be configured to support at least 25 addresses.

#### ropsten/mainnet
These two modes run on Orbs testnet (configured under gamma env labeled `integrative`) and a remote ethereum node.

### TODOs
Move voting/build/ethereum folder to /release/ethereum/contracts
