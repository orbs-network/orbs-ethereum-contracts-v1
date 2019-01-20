# Autonomous Swap Bridge

## Installation

* Install go: `brew install go`
* Install node and yarn: `brew install node yarn`
* Install ganache: https://truffleframework.com/ganache
* Install docker: https://docs.docker.com/v17.12/docker-for-mac/install
* Install gamma-cli: `brew install orbs-network/devtools/gamma-cli`
* Open project root directory: `cd ~/go/src/github.com/orbs-network/orbs-network-go/vendor/github.com/orbs-network/orbs-ethereum-contracts/ASB`
* Install project by running in terminal: `yarn` this will install truffle, you can skip if you already have it.

## Testing on Ganache and Gamma (local)

1. Before you start:
    * Make sure ganache is running locally on port 8545
    * Go over the configuration in `./ganache_test.go`
      * Notice for example you need to change `UserAccountOnEthereum` to one of the accounts from your ganache

2. Deploying the contracts:
    * Open project root directory: `cd ~/go/src/github.com/orbs-network/asb2018`
    * Run in terminal: `./ganache_1_deploy.sh`
    * After, don't forget to update configuration values in `./ganache_test.go` according to instructions

3. Swapping from Ethereum to Orbs:
    * Open project root directory: `cd ~/go/src/github.com/orbs-network/asb2018`
    * Run in terminal: `./ganache_2_eth_to_orbs.sh`

4. Swapping back from Orbs to Ethereum:
    * Open project root directory: `cd ~/go/src/github.com/orbs-network/asb2018`
    * Run in terminal: `./ganache_3_orbs_to_eth.sh`
    
5. When you finish:
    * Stop Gamma server by running: `gamma-cli stop-local`
    * Close ganache

## Testing on Ropsten and Orbs test net (remote)

1. Before you start:
    * Create an infura account and insert its endpoint URL (with token) in `truffle-config.js` 
    * Create an Ethereum account funded with Ropsten ETH (> 2) and insert its mnemonic in `truffle-config.js`
    * Go over the configuration in `./ropsten_test.go`
      * You may want to change the Orbs contract names to avoid name collisions on test net (eg. add a number at end)
      * If you don't have your own ERC20 contract, leave `EthereumErc20Address` empty until after deployment stage
      * Notice you need to change `UserAccountOnEthereum` to your HDWallet account from `truffle-config.js`
      * If you inserted your own ERC20 contract, make sure `UserAccountOnEthereum` has enough tokens for the transfer

2. Deploying the contracts:
    * Open project root directory: `cd ~/go/src/github.com/orbs-network/asb2018`
    * Run in terminal: `./ropsten_1_deploy.sh`
      * Notice that contract deployments to Ropsten may be slow and appear to be stuck (they're waiting to be mined), it's normal to wait a few minutes here 
    * After, don't forget to update configuration values in `./ropsten_test.go` according to instructions

3. Swapping from Ethereum to Orbs:
    * Open project root directory: `cd ~/go/src/github.com/orbs-network/asb2018`
    * Run in terminal: `./ropsten_2_eth_to_orbs.sh`

4. Swapping back from Orbs to Ethereum:
    * Open project root directory: `cd ~/go/src/github.com/orbs-network/asb2018`
    * Run in terminal: `./ropsten_3_orbs_to_eth.sh`
