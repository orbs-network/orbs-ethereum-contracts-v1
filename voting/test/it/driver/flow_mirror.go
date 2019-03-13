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
	orbs.SetFirstElectionBlockNumber(config.OrbsVotingContractName, config.FirstElectionBlockNumber)
	logStageDone("Election starts at block number %d", config.FirstElectionBlockNumber)

	logStage("Waiting for finality...")
	waitForFinality(config.FirstElectionBlockNumber, orbs, ethereum)
	logStageDone("Election starts at block number %d", config.FirstElectionBlockNumber)

	logStage("Running mirror script...")
	na.Mirror(config.OrbsVotingContractName, config.EthereumErc20Address, config.EthereumVotingAddress, ethereum.GetStartOfHistoryBlock(), config.FirstElectionBlockNumber,
		ethereum.GetConnectionUrl(), orbs.GetOrbsEnvironment())

	require.True(t, ethereum.GetCurrentBlock() < config.FirstElectionBlockNumber+orbs.GetMirrorVotingPeriod(), "Mirroring did not complete within mirroring grace period. consider increasing adapter.voteMirrorPeriod")

	logStageDone("Running mirror script")

	logSummary("Mirror Phase all done.\n\n")
}

func waitForFinality(blockNumber int, orbs OrbsAdapter, ethereum EthereumAdapter) {
	targetBlockHeight := blockNumber + orbs.GetFinalityBlocksComponent() + 1
	ethereum.WaitForBlock(targetBlockHeight)
	sleepFor := orbs.GetFinalityTimeComponent()
	fmt.Printf("%v > Due to finality time component, sleeping for %v\n", time.Now().Format("15:04:05"), sleepFor)
	time.Sleep(sleepFor)
	ethereum.WaitForBlock(ethereum.GetCurrentBlock() + 1) // force a new block to be closed - expecting it's timestamp to be beyond finality time component (based on our local clock)
}

func oldManualMirroringFlow_commentedOut() {
	//logStage("Running script to find Delegate Transfer Events ...")
	//delegateByTransferEvents := na.FindDelegateByTransferEvents(config.EthereumErc20Address, ethereum.GetStartOfHistoryBlock(), currentBlock)
	//// TODO v1 calculate how many delegate transfer, which to/from -- issue i hold index and not address ??
	////require.Equal(t, 7, len(delegateByTransferEvents), "should be 8 transfer txs")
	//logStageDone("Delegate Transfer events = %v", delegateByTransferEvents)
	//
	//logStage("Mirroring %d Delegate Transfer Events ...", len(delegateByTransferEvents))
	//for _, dt := range delegateByTransferEvents {
	//	orbs.MirrorDelegateByTransfer(config.OrbsVotingContractName, dt.TxHash)
	//}
	//logStageDone("Mirroring Delegate Transfer")
	//
	//logStage("Running script to find Delegate Events ...")
	//delegateEvents := na.FindDelegateEvents(config.EthereumVotingAddress, ethereum.GetStartOfHistoryBlock(), currentBlock)
	//// TODO v1 calculate how many delegate which to/from -- issue i hold index and not address ??
	////require.Equal(t, 7, len(delegateByTransferEvents), "should be 8 transfer txs")
	//logStageDone("Delegate Transfer events = %v", delegateEvents)
	//
	//logStage("Mirroring %d Delegate Events ...", len(delegateEvents))
	//for _, dt := range delegateEvents {
	//	orbs.MirrorDelegate(config.OrbsVotingContractName, dt.TxHash)
	//}
	//logStageDone("Mirroring Delegate")
	//
	//logStage("Running script to find Voting Events ...")
	//votingEvents := na.FindVoteEvents(config.EthereumVotingAddress, ethereum.GetStartOfHistoryBlock(), currentBlock)
	//// TODO v1 calculate how many vote, which to/from -- issue i hold index and not address ??
	////require.Equal(t, 7, len(delegateByTransferEvents), "should be 8 transfer txs")
	//logStageDone("Voting events = %v", votingEvents)
	//
	//logStage("Mirroring %d Voting Events ...", len(votingEvents))
	//for _, vt := range votingEvents {
	//	orbs.MirrorVote(config.OrbsVotingContractName, vt.TxHash)
	//}
	//logStageDone("Mirroring Voting")
}
