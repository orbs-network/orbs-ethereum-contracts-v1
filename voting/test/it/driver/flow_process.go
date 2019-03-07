package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunProcessFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(false))

	logStage("Running processing ...")
	maxSteps := len(config.Transfers) + len(config.Delegates) + len(config.Votes) + 2
	steps := 0
	isDone := false

	for !isDone && steps < maxSteps {
		isDone = orbs.RunVotingProcess(getOrbsVotingContractName())
		steps++
	}
	logStageDone("RunVotingProcess called %d times", steps)

	require.True(t, steps < maxSteps, "should be n steps")

	logStage("Running processing ...")
	winners := orbs.GetElectedNodes(getOrbsValidatorsConfigContractName())
	logStageDone("And the %d winners are .... %v", len(winners), winners)

	logSummary("Process Phase all done.")

}
