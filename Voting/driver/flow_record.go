package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunRecordFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(false))

	for i := 0; i < len(config.Transfers); i++ {
		logStage("Transfer %d : %d tokens from Ethereum user account %d to Ethereum user account %d...", i, config.Transfers[i].Amount, config.Transfers[i].FromIndex, config.Transfers[i].ToIndex)

		fromBeforeBalance := ethereum.GetBalanceByIndex(config.EthereumErc20Address, config.Transfers[i].FromIndex)
		toBeforeBalance := ethereum.GetBalanceByIndex(config.EthereumErc20Address, config.Transfers[i].ToIndex)
		ethereum.TransferFundsAccount(config.EthereumErc20Address, config.Transfers[i].FromIndex, config.Transfers[i].ToIndex, config.Transfers[i].Amount)
		fromAfterBalance := ethereum.GetBalanceByIndex(config.EthereumErc20Address, config.Transfers[i].FromIndex)
		toAfterBalance := ethereum.GetBalanceByIndex(config.EthereumErc20Address, config.Transfers[i].ToIndex)

		logStageDone("New Balances: Ethereum user account %d=%d, Ethereum user account %d=%d", config.Transfers[i].FromIndex, fromAfterBalance, config.Transfers[i].ToIndex, toAfterBalance)

		require.EqualValues(t, fromBeforeBalance-fromAfterBalance, config.Transfers[i].Amount, "from before %d after %d", fromBeforeBalance, fromAfterBalance)
		require.EqualValues(t, toAfterBalance-toBeforeBalance, config.Transfers[i].Amount, "to before %d after %d", toBeforeBalance, toAfterBalance)
	}

	logSummary("Recording Phase all done.\n\n")

}
