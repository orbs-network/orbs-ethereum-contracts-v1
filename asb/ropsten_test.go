package asb2018

import (
	"github.com/orbs-network/orbs-ethereum-contracts/asb/driver"

	"testing"
)

// EDIT THIS CONFIGURATION TO CONTROL THE TEST SCENARIO
// DON'T FORGET TO UPDATE VALUES ACCORDING TO INSTRUCTIONS AFTER DEPLOY
var configRopsten = &driver.Config{
	DebugLogs:                        true,              // shows detailed responses for every command
	EthereumErc20Address:             "",                // use your own or update after deploy with the resulting value
	OrbsErc20ContractName:            "ERC20TokenProxy", // choose different names to avoid collisions on test net
	OrbsAsbContractName:              "ASBEthereum",     // choose different names to avoid collisions on test net
	UserAccountOnEthereum:            "",                // HDWallet account from truffle-config.js, if you use your own ERC20, make sure it has enough tokens for transfer
	UserAccountOnOrbs:                "user1",           // one of the IDs in orbs-test-keys.json
	UserInitialBalanceOnEthereum:     20000,
	UserTransferAmountToOrbs:         130,
	UserTransferAmountBackToEthereum: 30,
}

func TestDeployOnRopsten(t *testing.T) {
	orbs := driver.AdapterForGammaCliTestnet(configRopsten)
	ethereum := driver.AdapterForTruffleRopsten(configRopsten)
	driver.RunDeployFlow(t, configRopsten, orbs, ethereum)
}

func TestEthToOrbsOnRopsten(t *testing.T) {
	orbs := driver.AdapterForGammaCliTestnet(configRopsten)
	ethereum := driver.AdapterForTruffleRopsten(configRopsten)
	driver.RunEthToOrbsFlow(t, configRopsten, orbs, ethereum)
}

func TestOrbsToEthOnRopsten(t *testing.T) {
	orbs := driver.AdapterForGammaCliTestnet(configRopsten)
	ethereum := driver.AdapterForTruffleRopsten(configRopsten)
	driver.RunOrbsToEthFlow(t, configRopsten, orbs, ethereum)
}
