// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func RunRecordFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {
	require.NoError(t, config.Validate(false))

	logStage("Doing %d Transfers ", len(config.Transfers))

	ethereum.TopUpEther(collectTransactingAccounts(config))

	for i := 0; i < len(config.Transfers); i++ {
		ethereum.Transfer(config.EthereumErc20Address, config.Transfers[i].FromIndex, config.Transfers[i].ToIndex, config.Transfers[i].Amount)
		config.AccountStakeValues[config.Transfers[i].FromIndex] -= config.Transfers[i].Amount
		config.AccountStakeValues[config.Transfers[i].ToIndex] += config.Transfers[i].Amount
	}
	balances := ethereum.GetStakes(config.EthereumErc20Address, config.NumberOfAccounts)
	require.Len(t, balances, len(config.AccountStakeValues))
	for i, conifgBalance := range config.AccountStakeValues {
		require.InDeltaf(t, conifgBalance, balances[i], 0.001, "balance of account %d in ethereum after transfer different from calculated one", i)
	}
	logStageDone("Stakes on Ethereum after transfers = %v", balances)

	for i := 0; i < len(config.Delegates); i++ {
		logStage("Delegation %d : Ethereum user account %d delegates to Ethereum user account %d...", i, config.Delegates[i].FromIndex, config.Delegates[i].ToIndex)
		ethereum.Delegate(config.EthereumVotingAddress, config.Delegates[i].FromIndex, config.Delegates[i].ToIndex)
		logStageDone("Delegated")
	}

	for i := 0; i < len(config.Votes); i++ {
		logStage("Vote %d : Ethereum guardian account %d votes for %v ...", i, config.Votes[i].GuardianIndex, config.Votes[i].Candidates)
		ethereum.Vote(config.EthereumVotingAddress, config.Votes[i].GuardianIndex, config.Votes[i].Candidates)
		logStageDone("Voted")
	}

	if config.FirstElectionBlockNumber != 0 {
		currentBlock := ethereum.GetCurrentBlock()
		require.True(t, currentBlock < config.FirstElectionBlockNumber, "Recorded activity will not be included in the current election period")
	}

	logSummary("Recording Phase all done.\n\n")
}

func collectTransactingAccounts(config *Config) []int {
	accountMap := map[int]bool{}
	for i := 0; i < len(config.Transfers); i++ {
		accountMap[config.Transfers[i].FromIndex] = true
	}
	for i := 0; i < len(config.Delegates); i++ {
		accountMap[config.Delegates[i].FromIndex] = true
	}
	for i := 0; i < len(config.Votes); i++ {
		accountMap[config.Votes[i].GuardianIndex] = true
	}
	accountsArr := make([]int, 0, len(accountMap))
	for account := range accountMap {
		accountsArr = append(accountsArr, account)
	}
	return accountsArr
}
