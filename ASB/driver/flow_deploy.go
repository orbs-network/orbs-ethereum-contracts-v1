package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunDeployFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NotEmpty(t, config.UserAccountOnEthereum, "UserAccountOnEthereum in configuration is empty, did you forget to update it?")

	logStage("Deploying Orbs ERC20 contract...")
	orbs.DeployERC20Contract(config.OrbsErc20ContractName, config.OrbsAsbContractName)
	logStageDone("OrbsName=%s", config.OrbsErc20ContractName)

	logStage("Deploying Orbs ASB contract...")
	orbs.DeployASBContract(config.OrbsAsbContractName, config.OrbsErc20ContractName)
	logStageDone("OrbsName=%s", config.OrbsAsbContractName)

	deployingEthereumErc20 := (config.EthereumErc20Address == "")
	if deployingEthereumErc20 {

		logStage("Deploying Ethereum ERC20 contract...")
		config.EthereumErc20Address = ethereum.DeployERC20Contract()
		logStageDone("EthereumAddress=%s", config.EthereumErc20Address)

		logStage("Funding Ethereum user account...")
		userEthereumBalance := ethereum.FundUserAccount(config.EthereumErc20Address, config.UserAccountOnEthereum, config.UserInitialBalanceOnEthereum)
		logStageDone("BalanceOnEthereum=%d", userEthereumBalance)

		require.Equal(t, config.UserInitialBalanceOnEthereum, userEthereumBalance)

	} else {

		logStage("Using existing Ethereum ERC20 contract...")
		logStageDone("EthereumAddress=%s", config.EthereumErc20Address)

	}

	logStage("Deploying Ethereum ASB contract...")
	ethereumAsbAddress := ethereum.DeployASBContract(config.EthereumErc20Address, config.OrbsAsbContractName)
	logStageDone("EthereumAddress=%s", ethereumAsbAddress)

	logStage("Binding Orbs ASB contract to Ethereum ABS contract...")
	orbs.BindASBContractToEthereum(config.OrbsAsbContractName, ethereumAsbAddress)
	logStageDone("")

	if deployingEthereumErc20 {

		logSummary("All done. IMPORTANT! Please update the test configuration with this value:\n\n    EthereumErc20Address: %s\n\n", config.EthereumErc20Address)

	} else {

		logSummary("All done.\n\n")

	}

}
