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

	for !isDone && steps < 100 {
		isDone = orbs.RunVotingProcess(getOrbsVotingContractName())
		steps++
	}
	logStageDone("Ran process calls %d times", steps)

	require.True(t, steps < 100 /* TODO v1 TODO NOAM how many steps ?*/, "should be n steps")

	logStage("Running processing ...")
	winners := orbs.GetElectedNodes(getOrbsValidatorsConfigContractName(), 100 /* TODO v1 get block*/)
	logStageDone("And the %d winners are .... %v", len(winners), winners)

	logSummary("Process Phase all done.")

}
