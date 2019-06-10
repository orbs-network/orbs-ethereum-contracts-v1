// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import (
	"fmt"
	"github.com/stretchr/testify/require"
	"testing"
	"time"
)

func RunMirrorFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(false))
	na := NodeAdater(config)

	currentBlock := ethereum.GetCurrentBlock()

	if config.FirstElectionBlockNumber == 0 {
		config.FirstElectionBlockNumber = currentBlock + 1
	}

	logStage("Set election date...")
	orbs.SetElectionBlockNumber(config.OrbsVotingContractName, config.FirstElectionBlockNumber)
	logStageDone("Election starts at block number %d", config.FirstElectionBlockNumber)

	logStage("Waiting for finality...")
	waitForFinality(config.FirstElectionBlockNumber, orbs, ethereum)
	orbs.SendTransactionGetProof() // advance orbs by one block - otherwise gamma doesn't close block and getEthereumBlockNumber in process fails to note ganache advanced
	logStageDone("Election starts at block number %d", config.FirstElectionBlockNumber)

	logStage("Running mirror script...")
	na.Mirror(config.OrbsVotingContractName, config.EthereumErc20Address, config.EthereumVotingAddress, ethereum.GetStartOfHistoryBlock(), config.FirstElectionBlockNumber,
		ethereum.GetConnectionUrl(), orbs.GetOrbsEnvironment())

	// TODO create orbs.GetCurrentFinalBlock() to enable this require:
	//require.True(t, orbs.GetCurrentFinalBlock() < config.FirstElectionBlockNumber+orbs.GetMirrorVotingPeriod() + orbs.GetFinalityBlocksComponent() + , "Mirroring did not complete within mirroring grace period. consider increasing adapter.voteMirrorPeriod")

	logStageDone("Running mirror script")

	logSummary("Mirror Phase all done.\n\n")
}

func waitForFinality(blockNumber int, orbs OrbsAdapter, ethereum EthereumAdapter) {
	targetBlockHeight := blockNumber + orbs.GetFinalityBlocksComponent()
	ethereum.WaitForBlock(targetBlockHeight)
	sleepFor := orbs.GetFinalityTimeComponent()
	fmt.Printf("%v > Due to finality time component, sleeping for %v\n", time.Now().Format("15:04:05"), sleepFor)
	time.Sleep(sleepFor)
	ethereum.WaitForBlock(ethereum.GetCurrentBlock() + 1) // force a new block to be closed - expecting it's timestamp to be beyond finality time component (based on our local clock)
}
