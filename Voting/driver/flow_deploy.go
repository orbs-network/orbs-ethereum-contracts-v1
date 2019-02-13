package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunDeployFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NotEmpty(t, config.UserAccountOnEthereum, "UserAccountOnEthereum in configuration is empty, did you forget to update it?")

	deployingEthereumErc20 := (config.EthereumErc20Address == "")
	if deployingEthereumErc20 {
		// Temp deploy of orbs contracts
		orbs.DeployContract("OrbsVoting", "OrbsConfig")

		logStage("Deploying Ethereum ERC20 contract...")
		config.EthereumErc20Address = ethereum.DeployERC20Contract()
		logStageDone("Ethereum ERC20 contract Address=%s", config.EthereumErc20Address)

		for i := 0; i < config.StakeHoldersNumber; i++ {
			logStage("Funding Ethereum user account %d...", i)
			userEthereumBalance := ethereum.FundStakeAccount(config.EthereumErc20Address, i, config.StakeHoldersInitialValues[i])
			logStageDone("BalanceOnEthereum=%d", userEthereumBalance)

			require.Equal(t, config.StakeHoldersInitialValues[i], userEthereumBalance)
		}

	} else {

		logStage("Using existing Ethereum ERC20 contract...")
		logStageDone("EthereumAddress=%s", config.EthereumErc20Address)

	}

	if deployingEthereumErc20 {

		logSummary("Deploy Phase all done. IMPORTANT! Please update the test configuration with this value:\n\n    EthereumErc20Address: %s\n\n", config.EthereumErc20Address)

	} else {

		logSummary("Deploy Phase all done.\n\n")

	}

}
