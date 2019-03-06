package driver

import (
	"github.com/stretchr/testify/require"
	"strings"
	"testing"
)

func RunMirrorFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(false))
	na := NodeAdater(config)

	currentBlock := ethereum.GetCurrentBlock()

	logStage("Set election date ...")
	orbs.SetFirstElectionBlockHeight(getOrbsVotingContractName(), currentBlock+1)
	logStageDone("Election date in ethereum block number = %d", currentBlock+1)

	logStage("Running script to find Delegate Transfer Events ...")
	delegateByTransferEvents := na.FindDelegateByTransferEvents(config.EthereumErc20Address, ethereum.GetStartOfHistoryBlock(), currentBlock)
	// TODO v1 calculate how many delegate transfer, which to/from -- issue i hold index and not address ??
	//require.Equal(t, 7, len(delegateByTransferEvents), "should be 8 transfer txs")
	logStageDone("Delegate Transfer events = %v", delegateByTransferEvents)

	logStage("Mirroring %d Delegate Transfer Events ...", len(delegateByTransferEvents))
	for _, dt := range delegateByTransferEvents {
		orbs.MirrorDelegateByTransfer(getOrbsVotingContractName(), dt.TxHash)
		// check it was set in state
		addr, blockNumber, txIndex, method := orbs.GetDelegateData(getOrbsVotingContractName(), dt.DelegatorAddress)
		require.EqualValues(t, dt.DelegateeAddress, addr)
		require.EqualValues(t, dt.Block, blockNumber)
		require.EqualValues(t, dt.TransactionIndex, txIndex)
		require.EqualValues(t, dt.Method, method)
	}
	logStageDone("Mirroring Delegate Transfer")

	logStage("Running script to find Delegate Events ...")
	delegateEvents := na.FindDelegateEvents(config.EthereumVotingAddress, ethereum.GetStartOfHistoryBlock(), currentBlock)
	// TODO v1 calculate how many delegate which to/from -- issue i hold index and not address ??
	//require.Equal(t, 7, len(delegateByTransferEvents), "should be 8 transfer txs")
	logStageDone("Delegate Transfer events = %v", delegateEvents)

	logStage("Mirroring %d Delegate Events ...", len(delegateEvents))
	for _, dt := range delegateEvents {
		orbs.MirrorDelegate(getOrbsVotingContractName(), dt.TxHash)
		// Checking state after delegation mirror
		addr, blockNumber, txIndex, method := orbs.GetDelegateData(getOrbsVotingContractName(), dt.DelegatorAddress)
		require.EqualValues(t, dt.DelegateeAddress, addr)
		require.EqualValues(t, dt.Block, blockNumber)
		require.EqualValues(t, dt.TransactionIndex, txIndex)
		require.EqualValues(t, dt.Method, method)
	}
	logStageDone("Mirroring Delegate")

	logStage("Running script to find Voting Events ...")
	votingEvents := na.FindVoteEvents(config.EthereumVotingAddress, ethereum.GetStartOfHistoryBlock(), currentBlock)
	// TODO v1 calculate how many vote, which to/from -- issue i hold index and not address ??
	//require.Equal(t, 7, len(delegateByTransferEvents), "should be 8 transfer txs")
	logStageDone("Voting events = %v", votingEvents)

	logStage("Mirroring %d Voting Events ...", len(votingEvents))
	for _, vt := range votingEvents {
		orbs.MirrorVote(getOrbsVotingContractName(), vt.TxHash)
	}
	// Checking state after vote mirror
	for _, vt := range votingEvents {
		addresses, blockNumber, txIndex := orbs.GetVoteData(getOrbsVotingContractName(), vt.ActivistAddress)
		candidatesStr := "0x"
		for _, s := range vt.getAddresses() {
			candidatesStr += s[2:]
		}
		require.EqualValues(t, strings.ToLower(candidatesStr), strings.ToLower(addresses))
		require.EqualValues(t, vt.Block, blockNumber)
		require.EqualValues(t, vt.TransactionIndex, txIndex)
	}
	logStageDone("Mirroring Voting")

	logStage("Advance 10 ethereum blocks ...")
	for i := 0; i < 10; i++ {
		ethereum.Transfer(config.EthereumErc20Address, 14, 13, 1)
	}
	logStageDone("Advance done")

	logSummary("Mirror Phase all done.\n\n")

}
