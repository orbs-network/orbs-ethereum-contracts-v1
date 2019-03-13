### Pre-Requisutes:

* Install go: `brew install go`
* Install node and yarn: `brew install node`
* Install ganache: https://truffleframework.com/ganache
* Install docker: https://docs.docker.com/v17.12/docker-for-mac/install
* Install gamma-cli: `brew install orbs-network/devtools/gamma-cli`
* Install project by running in terminal: `npm install` 
* For Ropsten: 
    * Make sure ROPSTEN_SECRET and ROPSTEN_INFURA_URL are set
* Run:
```
> mkdir -p build/contracts && cp ../../build/ethereum/* build/contracts/
> ./node_modules/.bin/truffle compile --all
> cd ../../processor/ && npm install && cd -
```

* Set Ganache > Settings > Accounts & Keys > Total Accounts To Generate = 25

### Execute Test:

### TODOs
Move voting/build/ethereum folder to /release/ethereum/contracts
