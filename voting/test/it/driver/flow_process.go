package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunProcessFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(false))

	logStage("Running processing ...")
	steps := 0
	isDone := false
	//currentBlock := ethereum.GetCurrentBlock()
	//
	//logStage("Set election date ...")
	//orbs.SetFirstElectionBlockHeight(getOrbsVotingContractName(), currentBlock+1)
	//logStageDone("Election date in ethereum block number = %d", currentBlock+1)

	for !isDone && steps < 100 {
		isDone = orbs.RunVotingProcess(getOrbsVotingContractName())
		steps++
	}
	logStageDone("Ran process calls %d times", steps)

	require.True(t, steps < 100 /* v1 how many steps ?*/, "should be n steps")

	logStage("Running processing ...")
	winners := orbs.GetElectedNodes(getOrbsValidatorsConfigContractName(), 100 /* TODO v1 get block*/)
	logStageDone("And the %d winners are .... %v", len(winners), winners)

	logSummary("Process Phase all done.")

}
