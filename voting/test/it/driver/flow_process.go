package driver

import (
	"fmt"
	"github.com/stretchr/testify/require"
	"testing"
)

func RunProcessFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(false))
	na := NodeAdater(config)

	logStage("Wait for mirror period to end...")
	beginProcessingAtBlock := config.FirstElectionBlockNumber + orbs.GetMirrorVotingPeriod() + 1
	waitForFinality(beginProcessingAtBlock, orbs, ethereum)
	logStageDone("Wait for mirror period to end")

	logStage("Running processing...")
	maxSteps := len(config.Transfers) + len(config.Delegates) + len(config.Votes) + len(config.ValidatorsAccounts) + 2
	na.Process(config.OrbsVotingContractName, maxSteps, orbs.GetOrbsEnvironment())
	logStageDone("Running processing")

	logStage("Getting winners processing...")
	winners := orbs.GetElectedNodes(config.OrbsVotingContractName)
	logStageDone("And the %d winners are.... %v", len(winners), winners)

	require.Conditionf(t, func() bool {
		return len(winners) >= 4
	}, "expecting at least 4 winners but got %d", len(winners))

	logStage("Forwarding results to system...")
	orbs.ForwardElectionResultsToSystem(winners)
	signers := orbs.GetCurrentSystemBlockSigners()
	logStageDone("And the %d signers are.... %v", len(signers), signers)

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

	for key, value := range relationship {
		fmt.Printf("Delegator %d to agent %d\n", key, value)
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

	for i, stake := range config.DelegatorStakeValues {
		fmt.Printf("stake %d is %d\n", i, stake)
	}

	totalVotes := 0
	for _, guardian := range config.GuardiansAccounts {
		guardianVote[guardian] = config.DelegatorStakeValues[guardian]
		totalVotes += config.DelegatorStakeValues[guardian]
	}
	voteThreshhold := totalVotes * 7 / 10
	for key, value := range guardianVote {
		fmt.Printf("Guardiand %d all vote %d\n", key, value)
	}
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
