// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package test

import (
	"github.com/orbs-network/orbs-ethereum-contracts/asb/test/driver"
	"testing"
)

// EDIT THIS CONFIGURATION TO CONTROL THE TEST SCENARIO
// DON'T FORGET TO UPDATE VALUES ACCORDING TO INSTRUCTIONS AFTER DEPLOY
var configRopsten = &driver.Config{
	DebugLogs:                        true,                  // shows detailed responses for every command
	EthereumErc20Address:             "",                    // use your own or update after deploy with the resulting value
	OrbsErc20ContractName:            "ERC20TokenProxyTemp", // choose different names to avoid collisions on test net
	OrbsAsbContractName:              "ASBEthereumTemp",     // choose different names to avoid collisions on test net
	UserAccountOnEthereum:            "",                    // HDWallet account from truffle-config.js, if you use your own ERC20, make sure it has enough tokens for transfer
	UserAccountOnOrbs:                "user1",               // one of the IDs in orbs-test-keys.json
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
