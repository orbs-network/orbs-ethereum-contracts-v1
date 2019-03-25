// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import (
	"fmt"
	"github.com/stretchr/testify/require"
	"strings"
	"testing"
)

func RunProcessFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(false))
	na := NodeAdater(config)

	logStage("Wait for mirror period to end...")
	beginProcessingAtBlock := config.FirstElectionBlockNumber + orbs.GetMirrorVotingPeriod() + 1
	waitForFinality(beginProcessingAtBlock, orbs, ethereum)
	orbs.GetCurrentSystemBlockSigners() // advance orbs by one block - otherwise gamma doesn't close block and getEthereumBlockNumber in process fails to note ganache advanced
	logStageDone("Wait for mirror period to end")

	logStage("Running processing...")
	maxSteps := len(config.Transfers) + len(config.Delegates) + len(config.Votes) + len(config.ValidatorsAccounts) + 2
	na.Process(config.OrbsVotingContractName, maxSteps, orbs.GetOrbsEnvironment())
	logStageDone("Running processing")

	logStage("Getting winners processing...")
	winners := orbs.GetElectedNodes(config.OrbsVotingContractName)
	logStageDone("And the %d winners are.... %v", len(winners), winners)

	logStage("Getting winners from internal calculation...")
	independantWinners := independantCaluculateGetWinners(config, ethereum)
	require.ElementsMatch(t, independantWinners, winners)
	logStageDone("Got same results !")

	require.Conditionf(t, func() bool {
		return len(winners) >= 4
	}, "expecting at least 4 winners but got %d", len(winners))

	logStage("Forwarding results to system...")
	orbs.ForwardElectionResultsToSystem(winners)
	signers := orbs.GetCurrentSystemBlockSigners()
	logStageDone("And the %d signers are.... %v", len(signers), signers)

	logSummary("Process Phase all done.")

	if config.DebugLogs {
		orbsContractTxt := fmt.Sprintf(`OrbsVotingContractName: "%s",`+"\n", config.OrbsVotingContractName)
		erc20Txt := fmt.Sprintf(`EthereumErc20Address: "%s",`+"\n", config.EthereumErc20Address)
		votingTxt := fmt.Sprintf(`EthereumVotingAddress: "%s",`+"\n", config.EthereumVotingAddress)
		guardianTxt := fmt.Sprintf(`EthereumGuardiansAddress: "%s",`+"\n", config.EthereumGuardiansAddress)
		validatorTxt := fmt.Sprintf(`EthereumValidatorsAddress: "%s",`+"\n", config.EthereumValidatorsAddress)
		validatorRegTxt := fmt.Sprintf(`EthereumValidatorsRegAddress: "%s",`+"\n", config.EthereumValidatorsRegAddress)
		logSummary("If you want to rerun without re-deploy on ethereum please update the test configuration with these value:\n%s%s%s%s%s%s\nDeploy Phase all done.\n\n", orbsContractTxt, erc20Txt, votingTxt, validatorTxt, validatorRegTxt, guardianTxt)
	}
}

func independantCaluculateGetWinners(config *Config, ethereum EthereumAdapter) []string {
	stakes := ethereum.GetStakes(config.EthereumErc20Address, 25)
	validatorsData := ethereum.GetValidators(config.EthereumValidatorsAddress, config.EthereumValidatorsRegAddress)
	winnerIndexes := runNaiveCalculations(config, stakes)
	winnersOrbsAddresses := make([]string, 0, len(winnerIndexes))
	for _, winnerIndex := range winnerIndexes {
		for _, validatorData := range validatorsData {
			if validatorData.Index == winnerIndex {
				winnersOrbsAddresses = append(winnersOrbsAddresses, strings.ToLower(validatorData.OrbsAddress))
				break
			}
		}
	}
	return winnersOrbsAddresses
}

func runNaiveCalculations(config *Config, stakesInFloat map[int]float32) []int {
	stakes := make(map[int]int, len(stakesInFloat))
	for k, v := range stakesInFloat {
		stakes[k] = int(v)
	}

	relationship := make(map[int]int)
	for _, transfer := range config.Transfers {
		if transfer.Amount == DELEGATE_TRANSFER {
			relationship[transfer.FromIndex] = transfer.ToIndex
		}
	}

	for _, delegate := range config.Delegates {
		relationship[delegate.FromIndex] = delegate.ToIndex
	}

	//for key, value := range relationship {
	//	fmt.Printf("Delegator %d to agent %d : stake %f \n", key, value, stakes[key])
	//}

	// run twice
	for from, to := range relationship {
		if stakes[from] != 0 {
			stakes[to] = stakes[to] + stakes[from]
			stakes[from] = 0
		}
	}
	for from, to := range relationship {
		if stakes[from] != 0 {
			stakes[to] = stakes[to] + stakes[from]
			stakes[from] = 0
		}
	}

	//for i, stake := range stakes {
	//	fmt.Printf("after stake of %d is %d\n", i, stake)
	//}

	guardianVote := make(map[int]int)
	totalVotes := 0
	for _, guardian := range config.GuardiansAccounts {
		guardianVote[guardian] = stakes[guardian]
		totalVotes += stakes[guardian]
	}
	voteThreshhold := totalVotes * 7 / 10
	//for key, value := range guardianVote {
	//	fmt.Printf("Guardiand %d all vote %d\n", key, value)
	//}
	//fmt.Printf("total votes : %d . threshhold %d\n", totalVotes, voteThreshhold)

	guardians := make(map[int]bool)
	for _, guardian := range config.GuardiansAccounts {
		guardians[guardian] = true
	}

	guardianToCandidate := make(map[int][]int)
	for _, vote := range config.Votes {
		if guardians[vote.GuardianIndex] {
			guardianToCandidate[vote.GuardianIndex] = vote.Candidates
		}
	}

	candidateVote := make(map[int]int)
	for guardian, candidates := range guardianToCandidate {
		//fmt.Printf("Guardiand %d voted for %v\n", guardian, candidates)
		for _, candidate := range candidates {
			candidateVote[candidate] = candidateVote[candidate] + guardianVote[guardian]
		}
	}

	elected := make([]int, 0)
	for _, validValidator := range config.ValidatorsAccounts {
		vote, ok := candidateVote[validValidator]
		if !ok || vote < voteThreshhold {
			elected = append(elected, validValidator)
			//	fmt.Printf("validator %d , elected with %d\n", validValidator, vote)
			//} else {
			//	fmt.Printf("candidate %d , voted out by %d\n", validValidator, vote)
		}
	}
	return elected
}
