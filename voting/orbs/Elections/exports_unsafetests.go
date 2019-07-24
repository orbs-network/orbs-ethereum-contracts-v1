// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

// +build unsafetests

package elections_systemcontract

import (
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
)

var PUBLIC = sdk.Export(getTokenEthereumContractAddress, getGuardiansEthereumContractAddress, getVotingEthereumContractAddress, getValidatorsEthereumContractAddress, getValidatorsRegistryEthereumContractAddress,
	unsafetests_setTokenEthereumContractAddress, unsafetests_setGuardiansEthereumContractAddress,
	unsafetests_setVotingEthereumContractAddress, unsafetests_setValidatorsEthereumContractAddress, unsafetests_setValidatorsRegistryEthereumContractAddress,
	unsafetests_setVariables, unsafetests_setElectedValidators, unsafetests_setCurrentElectedBlockNumber,
	unsafetests_setCurrentElectionTimeNanos, unsafetests_setElectionMirrorPeriodInSeconds, unsafetests_setElectionVotePeriodInSeconds, unsafetests_setElectionPeriodInSeconds,
	mirrorDelegationByTransfer, mirrorDelegation,
	processVoting, isProcessingPeriod, hasProcessingStarted,
	getElectionPeriod, getCurrentElectionBlockNumber, getNextElectionBlockNumber, getEffectiveElectionBlockNumber, getNumberOfElections,
	getElectionPeriodInNanos, getEffectiveElectionTimeInNanos, getCurrentElectionTimeInNanos, getNextElectionTimeInNanos,
	getCurrentEthereumBlockNumber, getProcessingStartBlockNumber, isElectionOverdue, getMirroringEndBlockNumber,
	getElectedValidatorsOrbsAddress, getElectedValidatorsEthereumAddress, getElectedValidatorsEthereumAddressByBlockNumber, getElectedValidatorsOrbsAddressByBlockHeight,
	getElectedValidatorsOrbsAddressByIndex, getElectedValidatorsEthereumAddressByIndex, getElectedValidatorsBlockNumberByIndex, getElectedValidatorsBlockHeightByIndex,
	getCumulativeParticipationReward, getCumulativeGuardianExcellenceReward, getCumulativeValidatorReward,
	getGuardianStake, getGuardianVotingWeight, getTotalStake, getValidatorStake, getValidatorVote, getExcellenceProgramGuardians,
	startTimeBasedElections,

	unsafetests_convertTimeToBlock, unsafetests_convertBlockToTime,
	unsafetests_getBlock, unsafetests_getTime,
)
var SYSTEM = sdk.Export(_init)

/***
 * unsafetests functions
 */
func unsafetests_setVariables(voteMirrorPeriod uint64, voteValidPeriod uint64, electionPeriod uint64, maxElectedValidators uint32, minElectedValidators uint32) {
	VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS = voteMirrorPeriod
	VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS = voteValidPeriod
	ELECTION_PERIOD_LENGTH_IN_BLOCKS = electionPeriod
	MAX_ELECTED_VALIDATORS = int(maxElectedValidators)
	MIN_ELECTED_VALIDATORS = int(minElectedValidators)
}

func unsafetests_setElectedValidators(joinedAddresses []byte) {
	index := getNumberOfElections()
	_setElectedValidatorsOrbsAddressAtIndex(index, joinedAddresses)
}

func unsafetests_setCurrentElectedBlockNumber(blockNumber uint64) {
	_setElectedValidatorsBlockNumberAtIndex(getNumberOfElections(), safeuint64.Sub(blockNumber, getElectionPeriod()))
}

func unsafetests_setTokenEthereumContractAddress(addr string) {
	ETHEREUM_TOKEN_ADDR = addr
}

func unsafetests_setVotingEthereumContractAddress(addr string) {
	ETHEREUM_VOTING_ADDR = addr
}

func unsafetests_setValidatorsEthereumContractAddress(addr string) {
	ETHEREUM_VALIDATORS_ADDR = addr
}

func unsafetests_setValidatorsRegistryEthereumContractAddress(addr string) {
	ETHEREUM_VALIDATORS_REGISTRY_ADDR = addr
}

func unsafetests_setGuardiansEthereumContractAddress(addr string) {
	ETHEREUM_GUARDIANS_ADDR = addr
}

func unsafetests_getBlock() uint64 {
	fmt.Printf("elections : curr block %d\n", ethereum.GetBlockNumber())
	return ethereum.GetBlockNumber()
}

func unsafetests_getTime() uint64 {
	fmt.Printf("elections : curr time block %d\n", ethereum.GetBlockTime())
	return ethereum.GetBlockTime()
}

func unsafetests_convertTimeToBlock(time uint64) uint64 {
	calculatedBlock := ethereum.GetBlockNumberByTime(time)
	fmt.Printf("elections : convertTimeToBlock time block %d was converted to block number %d\n", time, calculatedBlock)
	return calculatedBlock
}

func unsafetests_convertBlockToTime(block uint64) uint64 {
	calculateTime := ethereum.GetBlockTimeByNumber(block)
	fmt.Printf("elections : convertBlockToTime block number %d converted to time block %d\n", block, calculateTime)
	return calculateTime
}

func unsafetests_setCurrentElectionTimeNanos(time uint64) {
	fmt.Printf("elections : set electiontime to %d period %d\n", time, getElectionPeriodInNanos())
	_setElectedValidatorsTimeInNanosAtIndex(getNumberOfElections(), safeuint64.Sub(time, getElectionPeriodInNanos()))
	fmt.Printf("elections : compare to current block %d, current block time :%d\n", ethereum.GetBlockNumber(), ethereum.GetBlockTime())
}

func unsafetests_setElectionMirrorPeriodInSeconds(period uint64) {
	MIRROR_PERIOD_LENGTH_IN_NANOS = period * NANOS
}

func unsafetests_setElectionVotePeriodInSeconds(period uint64) {
	VOTE_PERIOD_LENGTH_IN_NANOS = period * NANOS
}

func unsafetests_setElectionPeriodInSeconds(period uint64) {
	ELECTION_PERIOD_LENGTH_IN_NANOS = period * NANOS
}
