package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunEthToOrbsFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate())

	logStage("Checking balance in Ethereum...")
	ethereumInitialBalance := ethereum.GetBalance(config.EthereumErc20Address, config.UserAccountOnEthereum)
	logStageDone("BalanceOnEthereum=%d", ethereumInitialBalance)

	require.True(t, ethereumInitialBalance >= config.UserTransferAmountToOrbs, "your Ethereum account does not have enough tokens to transfer")

	logStage("Checking balance in Orbs...")
	userOrbsInitialBalance := orbs.GetBalance(config.OrbsErc20ContractName, config.UserAccountOnOrbs)
	logStageDone("BalanceOnOrbs=%d", userOrbsInitialBalance)

	logStage("Doing TransferOut from Ethereum...")
	ethereumTxHash, userEthereumBalance := ethereum.TransferOut(config.EthereumErc20Address, config.UserAccountOnEthereum, orbs.OrbsUserIdToHexAddress(config.UserAccountOnOrbs), config.UserTransferAmountToOrbs)
	logStageDone("EthereumTxHash=%s BalanceOnEthereum=%d", ethereumTxHash, userEthereumBalance)

	require.Equal(t, ethereumInitialBalance-config.UserTransferAmountToOrbs, userEthereumBalance)

	logStage("Doing TransferIn to Orbs...")
	userOrbsBalance := orbs.TransferIn(config.OrbsErc20ContractName, config.OrbsAsbContractName, config.UserAccountOnOrbs, ethereumTxHash)
	logStageDone("BalanceOnOrbs=%d", userOrbsBalance)

	require.Equal(t, userOrbsInitialBalance+config.UserTransferAmountToOrbs, userOrbsBalance)

	logSummary("All done.\n\n    BEFORE: %d tokens on Ethereum + %d tokens on Orbs\n    SWAP:   %d tokens Ethereum -> Orbs\n    AFTER:  %d tokens on Ethereum + %d tokens on Orbs\n\n", ethereumInitialBalance, userOrbsInitialBalance, config.UserTransferAmountToOrbs, userEthereumBalance, userOrbsBalance)

}
