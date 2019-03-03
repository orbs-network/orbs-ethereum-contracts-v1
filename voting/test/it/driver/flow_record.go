package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunRecordFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(false))

	blockStartingRecord := ethereum.GetCurrentBlock()
	account0BalanceBefore := config.StakeHolderValues[0]

	logStage("Doing %d Transfers ", len(config.Transfers))

	//for i := 0; i < len(config.Transfers); i++ {
	//	ethereum.Transfer(config.EthereumErc20Address, config.Transfers[i].FromIndex, config.Transfers[i].ToIndex, config.Transfers[i].Amount)
	//	config.StakeHolderValues[config.Transfers[i].FromIndex] -= config.Transfers[i].Amount
	//	config.StakeHolderValues[config.Transfers[i].ToIndex] += config.Transfers[i].Amount
	//}
	//balances := ethereum.GetStakes(config.EthereumErc20Address, config.StakeHoldersNumber)
	//require.Len(t, balances, len(config.StakeHolderValues))
	//require.EqualValues(t, config.StakeHolderValues, balances)
	//logStageDone("Stakes on Ethereum after transfers = %v", balances)
	//
	//for i := 0; i < len(config.Delegates); i++ {
	//	logStage("Delegation %d : Ethereum user account %d delegates to Ethereum user account %d...", i, config.Delegates[i].FromIndex, config.Delegates[i].ToIndex)
	//	ethereum.Delegate(config.EthereumVotingAddress, config.Transfers[i].FromIndex, config.Transfers[i].ToIndex)
	//	logStageDone("Delegated")
	//}
	//
	//for i := 0; i < len(config.Votes); i++ {
	//	logStage("Vote %d : Ethereum user account %d votes for %v ...", i, config.Votes[i].ActivistIndex, config.Votes[i].Candidates)
	//	ethereum.Vote(config.EthereumVotingAddress, config.Votes[i].ActivistIndex, config.Votes[i].Candidates)
	//	logStageDone("Voted")
	//}

	// Test callmethodatblock works
	logStage("Check Recoding is visible from orbs ")
	account0BalanceAfter := config.StakeHolderValues[0]
	blockEndingRecord := ethereum.GetCurrentBlock()

	orbsAccount0BalanceBefore := orbs.GetDelegatorStakeAtBlockNumber(getOrbsVotingContractName(), "0x30Fa9C078E094AfD0C45B62A1D75953C21B19611", blockStartingRecord)
	orbsAccount0BalanceAfter := orbs.GetDelegatorStakeAtBlockNumber(getOrbsVotingContractName(), "0x30Fa9C078E094AfD0C45B62A1D75953C21B19611", blockEndingRecord)

	require.EqualValues(t, account0BalanceBefore, orbsAccount0BalanceBefore)
	logStageDone("before %d , after %d ", orbsAccount0BalanceBefore, orbsAccount0BalanceAfter)
	require.EqualValues(t, account0BalanceAfter, orbsAccount0BalanceAfter)
	logStageDone("Recording visible from orbs ok!")

	logSummary("Recording Phase all done.\n\n")

}
