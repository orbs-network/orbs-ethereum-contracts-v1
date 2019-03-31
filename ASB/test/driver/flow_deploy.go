// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import (
	"github.com/orbs-network/orbs-ethereum-contracts/ASB/test/test"
	"github.com/stretchr/testify/require"
	"testing"
)

func RunDeployFlow(t *testing.T, config *test.Config, orbs test.OrbsAdapter, ethereum test.EthereumAdapter) {

	require.NotEmpty(t, config.UserAccountOnEthereum, "UserAccountOnEthereum in configuration is empty, did you forget to update it?")

	test.logStage("Deploying Orbs ERC20 contract...")
	orbs.DeployERC20Contract(config.OrbsErc20ContractName, config.OrbsAsbContractName)
	test.logStageDone("OrbsName=%s", config.OrbsErc20ContractName)

	test.logStage("Deploying Orbs ASB contract...")
	orbs.DeployASBContract(config.OrbsAsbContractName, config.OrbsErc20ContractName)
	test.logStageDone("OrbsName=%s", config.OrbsAsbContractName)

	deployingEthereumErc20 := (config.EthereumErc20Address == "")
	if deployingEthereumErc20 {

		test.logStage("Deploying Ethereum ERC20 contract...")
		config.EthereumErc20Address = ethereum.DeployERC20Contract()
		test.logStageDone("EthereumAddress=%s", config.EthereumErc20Address)

		test.logStage("Funding Ethereum user account...")
		userEthereumBalance := ethereum.FundUserAccount(config.EthereumErc20Address, config.UserAccountOnEthereum, config.UserInitialBalanceOnEthereum)
		test.logStageDone("BalanceOnEthereum=%d", userEthereumBalance)

		require.Equal(t, config.UserInitialBalanceOnEthereum, userEthereumBalance)

	} else {

		test.logStage("Using existing Ethereum ERC20 contract...")
		test.logStageDone("EthereumAddress=%s", config.EthereumErc20Address)

	}

	test.logStage("Deploying Ethereum ASB contract...")
	ethereumAsbAddress := ethereum.DeployASBContract(config.EthereumErc20Address, config.OrbsAsbContractName)
	test.logStageDone("EthereumAddress=%s", ethereumAsbAddress)

	test.logStage("Binding Orbs ASB contract to Ethereum ABS contract...")
	orbs.BindASBContractToEthereum(config.OrbsAsbContractName, ethereumAsbAddress)
	test.logStageDone("")

	if deployingEthereumErc20 {

		test.logSummary("All done. IMPORTANT! Please update the test configuration with this value:\n\n    EthereumErc20Address: %s\n\n", config.EthereumErc20Address)

	} else {

		test.logSummary("All done.\n\n")

	}

}
