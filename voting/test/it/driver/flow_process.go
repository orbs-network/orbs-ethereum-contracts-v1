package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunProcessFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(false))
	na := NodeAdater(config)

	logStage("Running processing ...")
	maxSteps := len(config.Transfers) + len(config.Delegates) + len(config.Votes) + 2
	na.Process(getOrbsVotingContractName(), maxSteps, orbs.GetOrbsEnvironment())

	winners := orbs.GetElectedNodes(getOrbsVotingContractName())
	logStageDone("And the %d winners are .... %v", len(winners), winners)

	logSummary("Process Phase all done.")

}
