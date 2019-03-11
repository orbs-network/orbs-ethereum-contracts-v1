package driver

import (
	"fmt"
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

	runNaiveCalulations(config)

	logSummary("Process Phase all done.")

}

func runNaiveCalulations(config *Config) []int {
	relationship := make(map[int]int)

	for _, transfer := range config.Transfers {
		if transfer.Amount == 0 {
			relationship[transfer.FromIndex] = transfer.ToIndex
		}
	}

	for _, delegate := range config.Delegates {
		relationship[delegate.FromIndex] = delegate.ToIndex
	}

	guardianVote := make(map[int]int)

	// run twice
	for from, to := range relationship {
		if config.DelegatorStakeValues[from] != 0 {
			config.DelegatorStakeValues[to] += config.DelegatorStakeValues[from]
			config.DelegatorStakeValues[from] = 0
		}
	}
	for from, to := range relationship {
		if config.DelegatorStakeValues[from] != 0 {
			config.DelegatorStakeValues[to] += config.DelegatorStakeValues[from]
			config.DelegatorStakeValues[from] = 0
		}
	}

	totalVotes := 0
	for _, guardian := range config.GuardiansAccounts {
		guardianVote[guardian] = config.DelegatorStakeValues[guardian]
		totalVotes += config.DelegatorStakeValues[guardian]
	}
	voteThreshhold := totalVotes * 7 / 10
	fmt.Printf("total votes : %d . threshhold %d\n", totalVotes, voteThreshhold)

	guardianToCandidate := make(map[int][3]int)
	for _, vote := range config.Votes {
		guardianToCandidate[vote.ActivistIndex] = vote.Candidates
	}

	candidateVote := make(map[int]int)
	for guardian, candidates := range guardianToCandidate {
		for _, candidate := range candidates {
			candidateVote[candidate] = candidateVote[candidate] + config.DelegatorStakeValues[guardian]
		}
	}

	elected := make([]int, 0)
	for candidate, vote := range candidateVote {
		fmt.Printf("candidate %d , got %d votes\n", candidate, vote)
		if vote < voteThreshhold {
			elected = append(elected, candidate)
			fmt.Printf("candidate %d , elected\n", candidate)
		} else {
			fmt.Printf("candidate %d , voted out\n", candidate)
		}
	}
	return elected
}
