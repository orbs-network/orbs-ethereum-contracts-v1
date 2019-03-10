package driver

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func RunRecordFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {
	require.NoError(t, config.Validate(false))

	logStage("Doing %d Transfers ", len(config.Transfers))

	for i := 0; i < len(config.Transfers); i++ {
		ethereum.Transfer(config.EthereumErc20Address, config.Transfers[i].FromIndex, config.Transfers[i].ToIndex, config.Transfers[i].Amount)
		config.StakeHolderValues[config.Transfers[i].FromIndex] -= config.Transfers[i].Amount
		config.StakeHolderValues[config.Transfers[i].ToIndex] += config.Transfers[i].Amount
	}
	balances := ethereum.GetStakes(config.EthereumErc20Address, config.StakeHoldersNumber)
	require.Len(t, balances, len(config.StakeHolderValues))
	require.EqualValues(t, config.StakeHolderValues, balances)
	logStageDone("Stakes on Ethereum after transfers = %v", balances)

	for i := 0; i < len(config.Delegates); i++ {
		logStage("Delegation %d : Ethereum user account %d delegates to Ethereum user account %d...", i, config.Delegates[i].FromIndex, config.Delegates[i].ToIndex)
		ethereum.Delegate(config.EthereumVotingAddress, config.Transfers[i].FromIndex, config.Transfers[i].ToIndex)
		logStageDone("Delegated")
	}

	for i := 0; i < len(config.Votes); i++ {
		logStage("Vote %d : Ethereum guardian account %d votes for %v ...", i, config.Votes[i].ActivistIndex, config.Votes[i].Candidates)
		ethereum.Vote(config.EthereumVotingAddress, config.Votes[i].ActivistIndex, config.Votes[i].Candidates)
		logStageDone("Voted")
	}

	ethereum.Mine(5) // just to have a bit of time pass before setting election/mirroring
	logSummary("Recording Phase all done.\n\n")
}
