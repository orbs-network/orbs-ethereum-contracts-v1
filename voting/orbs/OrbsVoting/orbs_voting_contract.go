// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package main

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/env"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/ethereum"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/safemath/safeuint64"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	"math/big"
	"sort"
)

/*****
 * Election results
 */
func getElectionPeriod() uint64 { // TODO dep
	return ELECTION_PERIOD_LENGTH_IN_BLOCKS
}

func getElectionPeriodInNanos() uint64 {
	return ELECTION_PERIOD_LENGTH_IN_NANOS
}

func getElectedValidatorsOrbsAddress() []byte {
	index := getNumberOfElections()
	return getElectedValidatorsOrbsAddressByIndex(index)
}

func getElectedValidatorsEthereumAddress() []byte {
	index := getNumberOfElections()
	return getElectedValidatorsEthereumAddressByIndex(index)
}

func getElectedValidatorsEthereumAddressByBlockNumber(blockNumber uint64) []byte {
	numberOfElections := getNumberOfElections()
	for i := numberOfElections; i > 0; i-- {
		if getElectedValidatorsBlockNumberByIndex(i) < blockNumber {
			return getElectedValidatorsEthereumAddressByIndex(i)
		}
	}
	return _getDefaultElectionResults()
}

func getElectedValidatorsOrbsAddressByBlockHeight(blockHeight uint64) []byte {
	numberOfElections := getNumberOfElections()
	for i := numberOfElections; i > 0; i-- {
		if getElectedValidatorsBlockHeightByIndex(i) < blockHeight {
			return getElectedValidatorsOrbsAddressByIndex(i)
		}
	}
	return _getDefaultElectionResults()
}

func _setElectedValidators(elected [][20]byte) {
	electionBlockNumber := _getCurrentElectionBlockNumber()
	index := getNumberOfElections()
	if getElectedValidatorsBlockNumberByIndex(index) > electionBlockNumber {
		panic(fmt.Sprintf("Election results rejected as new election happend at block %d which is older than last election %d",
			electionBlockNumber, getElectedValidatorsBlockNumberByIndex(index)))
	}
	index++
	_setElectedValidatorsBlockNumberAtIndex(index, electionBlockNumber)
	_setElectedValidatorsBlockHeightAtIndex(index, env.GetBlockHeight()+TRANSITION_PERIOD_LENGTH_IN_BLOCKS)
	electedOrbsAddresses := _translateElectedAddressesToOrbsAddressesAndConcat(elected)
	_setElectedValidatorsOrbsAddressAtIndex(index, electedOrbsAddresses)
	electedEthereumAddresses := _concatElectedEthereumAddresses(elected)
	_setElectedValidatorsEthereumAddressAtIndex(index, electedEthereumAddresses)
	_setNumberOfElections(index)
}

func _concatElectedEthereumAddresses(elected [][20]byte) []byte {
	electedForSave := make([]byte, 0, len(elected)*20)
	for _, addr := range elected {
		electedForSave = append(electedForSave, addr[:]...)
	}
	return electedForSave
}

func _translateElectedAddressesToOrbsAddressesAndConcat(elected [][20]byte) []byte {
	electedForSave := make([]byte, 0, len(elected)*20)
	for i := range elected {
		electedOrbsAddress := _getValidatorOrbsAddress(elected[i][:])
		fmt.Printf("elections %10d: translate %x to %x\n", _getCurrentElectionBlockNumber(), elected[i][:], electedOrbsAddress)
		electedForSave = append(electedForSave, electedOrbsAddress[:]...)
	}
	return electedForSave
}

func initCurrentElectionBlockNumber() {
	if getCurrentElectionBlockNumber() == 0 {
		currBlock := getCurrentEthereumBlockNumber()
		if currBlock < FIRST_ELECTION_BLOCK {
			_setCurrentElectionBlockNumber(FIRST_ELECTION_BLOCK)
		} else {
			blocksSinceFirstEver := safeuint64.Sub(currBlock, FIRST_ELECTION_BLOCK)
			blocksSinceStartOfAnElection := safeuint64.Mod(blocksSinceFirstEver, getElectionPeriod())
			blocksUntilNextElection := safeuint64.Sub(getElectionPeriod(), blocksSinceStartOfAnElection)
			nextElectionBlock := safeuint64.Add(currBlock, blocksUntilNextElection)
			_setCurrentElectionBlockNumber(nextElectionBlock)
		}
	}
}

func _getDefaultElectionResults() []byte {
	return []byte{}
}

func _formatElectionsNumber() []byte {
	return []byte("_CURRENT_ELECTION_INDEX_KEY_")
}

func getNumberOfElections() uint32 {
	return state.ReadUint32(_formatElectionsNumber())
}

func _setNumberOfElections(index uint32) {
	state.WriteUint32(_formatElectionsNumber(), index)
}

func _formatElectionBlockNumber(index uint32) []byte {
	return []byte(fmt.Sprintf("Election_%d_BlockNumber", index))
}

func getElectedValidatorsBlockNumberByIndex(index uint32) uint64 {
	return state.ReadUint64(_formatElectionBlockNumber(index))
}

func _setElectedValidatorsBlockNumberAtIndex(index uint32, blockNumber uint64) {
	state.WriteUint64(_formatElectionBlockNumber(index), blockNumber)
}

func _formatElectionBlockHeight(index uint32) []byte {
	return []byte(fmt.Sprintf("Election_%d_BlockHeight", index))
}

func getElectedValidatorsBlockHeightByIndex(index uint32) uint64 {
	return state.ReadUint64(_formatElectionBlockHeight(index))
}

func _setElectedValidatorsBlockHeightAtIndex(index uint32, blockHeight uint64) {
	state.WriteUint64(_formatElectionBlockHeight(index), blockHeight)
}

func _formatElectionValidatorEtheretumAddress(index uint32) []byte {
	return []byte(fmt.Sprintf("Election_%d_ValidatorsEth", index))
}

func getElectedValidatorsEthereumAddressByIndex(index uint32) []byte {
	return state.ReadBytes(_formatElectionValidatorEtheretumAddress(index))
}

func _setElectedValidatorsEthereumAddressAtIndex(index uint32, elected []byte) {
	state.WriteBytes(_formatElectionValidatorEtheretumAddress(index), elected)
}

func _formatElectionValidatorOrbsAddress(index uint32) []byte {
	return []byte(fmt.Sprintf("Election_%d_ValidatorsOrbs", index))
}

func getElectedValidatorsOrbsAddressByIndex(index uint32) []byte {
	return state.ReadBytes(_formatElectionValidatorOrbsAddress(index))
}

func _setElectedValidatorsOrbsAddressAtIndex(index uint32, elected []byte) {
	state.WriteBytes(_formatElectionValidatorOrbsAddress(index), elected)
}

func getEffectiveElectionBlockNumber() uint64 {
	return getElectedValidatorsBlockNumberByIndex(getNumberOfElections())
}

func _formatElectionBlockNumberKey() []byte { // TODO dep
	return []byte("Election_Block_Number")
}

func _getCurrentElectionBlockNumber() uint64 {
	initCurrentElectionBlockNumber()
	return getCurrentElectionBlockNumber()
}

func _setCurrentElectionBlockNumber(BlockNumber uint64) {
	state.WriteUint64(_formatElectionBlockNumberKey(), BlockNumber)
}

func getCurrentElectionBlockNumber() uint64 {
	return state.ReadUint64(_formatElectionBlockNumberKey())
}

func getNextElectionBlockNumber() uint64 {
	return safeuint64.Add(getCurrentElectionBlockNumber(), getElectionPeriod())
}

func getCurrentEthereumBlockNumber() uint64 {
	return ethereum.GetBlockNumber()
}

func getProcessingStartBlockNumber() uint64 {
	return safeuint64.Add(getCurrentElectionBlockNumber(), VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS)
}

func getMirroringEndBlockNumber() uint64 {
	return safeuint64.Add(getCurrentElectionBlockNumber(), VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS)
}

func _formatEffectiveElectionTimeKey() []byte {
	return []byte("Effective_Election_Time")
}

func getEffectiveElectionTimeInNanos() uint64 {
	return state.ReadUint64(_formatEffectiveElectionTimeKey())
}

func getCurrentElectionTimeInNanos() uint64 {
	return safeuint64.Add(getEffectiveElectionTimeInNanos(), getElectionPeriodInNanos())
}

func getNextElectionTimeInNanos() uint64 {
	return safeuint64.Add(getCurrentElectionTimeInNanos(), getElectionPeriodInNanos())
}

// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

/*****
 * Connections to Ethereum contracts
 */
var ETHEREUM_TOKEN_ADDR = "0xff56Cc6b1E6dEd347aA0B7676C85AB0B3D08B0FA"
var ETHEREUM_VOTING_ADDR = "0x30f855afb78758Aa4C2dc706fb0fA3A98c865d2d"
var ETHEREUM_VALIDATORS_ADDR = "0x240fAa45557c61B6959162660E324Bb90984F00f"
var ETHEREUM_VALIDATORS_REGISTRY_ADDR = "0x56A6895FD37f358c17cbb3F14A864ea5Fe871F0a"
var ETHEREUM_GUARDIANS_ADDR = "0xD64B1BF6fCAb5ADD75041C89F61816c2B3d5E711"

func getTokenEthereumContractAddress() string {
	return ETHEREUM_TOKEN_ADDR
}

func getTokenAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getGuardiansEthereumContractAddress() string {
	return ETHEREUM_GUARDIANS_ADDR
}

func getGuardiansAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianLeft","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"guardian","type":"address"}],"name":"GuardianUpdated","type":"event"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"isGuardian","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getGuardianData","outputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getRegistrationBlockNumber","outputs":[{"name":"registeredOn","type":"uint256"},{"name":"lastUpdatedOn","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardians","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardiansBytes20","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getVotingEthereumContractAddress() string {
	return ETHEREUM_VOTING_ADDR
}

func getVotingAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"validators","type":"address[]"},{"indexed":false,"name":"voteCounter","type":"uint256"}],"name":"VoteOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Delegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Undelegate","type":"event"},{"constant":false,"inputs":[{"name":"validators","type":"address[]"}],"name":"voteOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"undelegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVote","outputs":[{"name":"validators","type":"address[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getCurrentVoteBytes20","outputs":[{"name":"validatorsBytes20","type":"bytes20[]"},{"name":"blockNumber","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"delegator","type":"address"}],"name":"getCurrentDelegation","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getValidatorsEthereumContractAddress() string {
	return ETHEREUM_VALIDATORS_ADDR
}

func getValidatorsAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorApproved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorRemoved","type":"event"},{"constant":false,"inputs":[{"name":"validator","type":"address"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"validator","type":"address"}],"name":"remove","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"isValidator","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"isApproved","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getValidators","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getValidatorsBytes20","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getApprovalBlockNumber","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getValidatorsRegistryEthereumContractAddress() string {
	return ETHEREUM_VALIDATORS_REGISTRY_ADDR
}

func getValidatorsRegistryAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorLeft","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorUpdated","type":"event"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"ipAddress","type":"bytes4"},{"name":"website","type":"string"},{"name":"orbsAddress","type":"bytes20"}],"name":"register","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"ipAddress","type":"bytes4"},{"name":"website","type":"string"},{"name":"orbsAddress","type":"bytes20"}],"name":"update","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getValidatorData","outputs":[{"name":"name","type":"string"},{"name":"ipAddress","type":"bytes4"},{"name":"website","type":"string"},{"name":"orbsAddress","type":"bytes20"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getRegistrationBlockNumber","outputs":[{"name":"registeredOn","type":"uint256"},{"name":"lastUpdatedOn","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"isValidator","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getOrbsAddress","outputs":[{"name":"orbsAddress","type":"bytes20"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

// +build unsafetests

var PUBLIC = sdk.Export(getTokenEthereumContractAddress, getGuardiansEthereumContractAddress, getVotingEthereumContractAddress, getValidatorsEthereumContractAddress, getValidatorsRegistryEthereumContractAddress,
	unsafetests_setTokenEthereumContractAddress, unsafetests_setGuardiansEthereumContractAddress,
	unsafetests_setVotingEthereumContractAddress, unsafetests_setValidatorsEthereumContractAddress, unsafetests_setValidatorsRegistryEthereumContractAddress,
	unsafetests_setVariables, unsafetests_setElectedValidators, unsafetests_setElectedBlockNumber,
	unsafetests_setElectionTimeNanos, unsafetests_setElectionMirrorPeriodInNanos,
	mirrorDelegationByTransfer, mirrorDelegation,
	processVoting,
	getElectionPeriod, getCurrentElectionBlockNumber, getNextElectionBlockNumber, getEffectiveElectionBlockNumber, getNumberOfElections,
	getElectionPeriodInNanos, getEffectiveElectionTimeInNanos, getCurrentElectionTimeInNanos, getNextElectionTimeInNanos,
	getCurrentEthereumBlockNumber, getProcessingStartBlockNumber, getMirroringEndBlockNumber,
	getElectedValidatorsOrbsAddress, getElectedValidatorsEthereumAddress, getElectedValidatorsEthereumAddressByBlockNumber, getElectedValidatorsOrbsAddressByBlockHeight,
	getElectedValidatorsOrbsAddressByIndex, getElectedValidatorsEthereumAddressByIndex, getElectedValidatorsBlockNumberByIndex, getElectedValidatorsBlockHeightByIndex,
	getCumulativeParticipationReward, getCumulativeGuardianExcellenceReward, getCumulativeValidatorReward,
	getGuardianStake, getGuardianVotingWeight, getTotalStake, getValidatorStake, getValidatorVote, getExcellenceProgramGuardians,
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

func unsafetests_setElectedBlockNumber(blockNumber uint64) {
	_setCurrentElectionBlockNumber(blockNumber)
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

func unsafetests_setElectionTimeNanos(time uint64) {
	state.WriteUint64(_formatEffectiveElectionTimeKey(), safeuint64.Sub(time, getElectionPeriodInNanos()))
}

func unsafetests_setElectionMirrorPeriodInNanos(period uint64) {
	MIRROR_PERIOD_LENGTH_IN_NANOS = period
}

// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

func _firstElectionFixRewards() {
	key := []byte("_fix_rewards_first_election_")
	if state.ReadUint32(key) == 0 {
		guardians := _getGuardians()
		for guardian, _ := range guardians {
			reward := getCumulativeGuardianExcellenceReward(guardian[:])
			if reward != 0 {
				state.Clear(_formatCumulativeGuardianExcellenceReward(guardian[:]))
				fmt.Printf("elections %10d rewards fix: clear guardian %x, orig reward %d\n", getEffectiveElectionBlockNumber(), guardian, reward)
				reward = safeuint64.Div(safeuint64.Mul(reward, 1000), 2229)
				_addCumulativeGuardianExcellenceReward(guardian[:], reward)
				fmt.Printf("elections %10d rewards fix: guardian %x reward %d\n", getEffectiveElectionBlockNumber(), guardian, reward)
			}
			reward = getCumulativeParticipationReward(guardian[:])
			if reward != 0 {
				state.Clear(_formatCumulativeParticipationReward(guardian[:]))
				fmt.Printf("elections %10d rewards fix: clear guardian participant %x orig reward %d\n", getEffectiveElectionBlockNumber(), guardian, reward)
				reward = safeuint64.Div(safeuint64.Mul(reward, 1000), 4179)
				_addCumulativeParticipationReward(guardian[:], reward)
				fmt.Printf("elections %10d rewards fix: guardian participant %x reward %d\n", getEffectiveElectionBlockNumber(), guardian, reward)
			}

		}

		electionValidatorIntroduction := safeuint64.Div(safeuint64.Mul(ELECTION_VALIDATOR_INTRODUCTION_REWARD, 100), ANNUAL_TO_ELECTION_FACTOR)
		validators := _getValidators()
		for _, validator := range validators {
			reward := getCumulativeValidatorReward(validator[:])
			if reward != 0 {
				state.Clear(_formatCumulativeValidatorReward(validator[:]))
				fmt.Printf("elections %10d rewards fix: clear validator %x orig reward %d\n", getEffectiveElectionBlockNumber(), validator, reward)
				reward = safeuint64.Sub(reward, 8423)
				if reward != 0 {
					reward = safeuint64.Div(safeuint64.Mul(reward, 100), 11723)
				}
				reward = safeuint64.Add(reward, electionValidatorIntroduction)
				_addCumulativeValidatorReward(validator[:], reward)
				fmt.Printf("elections %10d rewards fix: validator %x reward %d\n", getEffectiveElectionBlockNumber(), validator, reward)
			}
		}
		state.WriteUint32(key, 1)
	} else {
		panic(fmt.Sprintf("cannot fix first election rewards anymore"))
	}
}

func _firstElectionFixRewardsDelegator(delegator []byte) {
	key := []byte(fmt.Sprintf("_fix_rewards_first_election_%s", hex.EncodeToString(delegator)))
	if state.ReadUint32(key) == 0 && getNumberOfElections() == 1 {
		reward := getCumulativeParticipationReward(delegator)
		if reward != 0 {
			state.Clear(_formatCumulativeParticipationReward(delegator))
			fmt.Printf("elections %10d rewards fix: clear participant %x original %d\n", getEffectiveElectionBlockNumber(), delegator, reward)
			reward = safeuint64.Div(safeuint64.Mul(reward, 1000), 4179)
			_addCumulativeParticipationReward(delegator[:], reward)
			fmt.Printf("elections %10d rewards fix: participant %x reward %d\n", getEffectiveElectionBlockNumber(), delegator, reward)
		}
		state.WriteUint32(key, 1)
	} else {
		panic(fmt.Sprintf("cannot fix first election rewards anymore"))
	}
}

// Copyright 2019 the orbs-network-go authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

/**

These two function fix the state for rewards and delegation and can be called only once (and between election 7928900 and 7948900).

Fixed a bug in the reward calculation contract that incorrectly counted a small number of delegations.
This issue affected 29 participating addresses, to the total sum of 89,668 ORBS.

_fixRewardsDrift7928900 : fixes the 20 delegators and 9 guardians rewards according to addresses
_fixDelegatorState7928900 : remove the double delegation pointer from the delegators' list in state.

*/

var participantsFixDoubleDelegationReward = []struct {
	address string
	reward  int
}{
	{"63cad78066b28c58f29f58a4f55827b2c2259776", 1350},  // instead of 2178
	{"aaa020747c3f27035a803a2a9b577e76ed5cdfc7", 441},   // instead of 693
	{"e4f60ade67862d6604cc7464621bc7ac17e75841", 220},   // instead of 352
	{"d5db86180abb0300334347a6a57bd318ffa7aebc", 860},   // instead of 1376
	{"9e912ba1ce059ceca9499ec9ec703b12d32cb50c", 860},   // instead of 1376
	{"606feb20c03a797a42390163dedd1d45297af73f", 680},   // instead of 973
	{"5d8c4be81a1203821b464bd76f43967f724d5004", 66},    // instead of 60
	{"a39fc2c9c437f2e56901ccc6bd18ee1100c82686", 902},   // instead of 1552
	{"683148b5e726a0c07561895e39f394c2d1ebf092", 99},    // instead of 90
	{"d7806c262ea5e3928d0970e2a0f19e931f9ed1af", 91751}, // instead of 83410
	{"fa76362c7937b02018abd99c04333d3b62ff7f3d", 624},   // instead of 1092
	{"9e2d2a783274c81337fec2e2897fee5ec614cca0", 539},   // instead of 490
	{"e933cedb1d7772ab3ca6ca8c173cc6b6ad61bb5f", 140},   // instead of 217
	{"0a91147313b82fdb20c853646e829b8d32a9fdb8", 1319},  // instead of 1879
	{"f07df0a74967c53611f2bb619eec462527ddb5d3", 297},   // instead of 270
	{"fddb0aa468c70be6440c46cfbdf099d2135e25a7", 2285},  // instead of 2287
	{"960ac2fd49b2088cfbb385fed12adb4d78429928", 6772},  // instead of 11800
	{"f061c6acc642676914aa7139abc89fbf97a06112", 20834}, // instead of 32198
	{"aa1a4565f2d875995d85e8d52e7193c666e20c04", 647},   // instead of 961
	{"8fd0a7b70aa896cf85b3034385f98af1d927d442", 4082},  // instead of 0
}

var guardiansFixDoubleDelegationReward = []struct {
	address string
	reward  int
}{
	{"f7ae622C77D0580f02Bcb2f92380d61e3F6e466c", 1399658}, // instead of 1403641
	{"63AEf7616882F488BCa97361d1c24F05B4657ae5", 1250192}, // instead of 1250217
	{"C82eC0F3c834d337c51c9375a1C0A65Ce7aaDaec", 865579},  // instead of 855152
	{"9afc8EF233e2793B2b90Ca5d70cA2e7098013142", 522112},  // instead of 522649
	{"8287928a809346dF4Cd53A096025a1136F7C4fF5", 340047},  // instead of 340157
	{"F058cCFB2324310C33E8FD9a1ddA8E99C8bEdA59", 527823},  // instead of 528491
	{"a3cBDD66267DAaA4B51Af6CD894c92054bb2F2c7", 21201},   // instead of 47243
	{"cB6172196BbCf5b4cf9949D7f2e4Ee802EF2b81D", 94199},   // instead of 85826
	{"1763F3DA9380E2df7FfDE1dC245801BB14F80669", 21887},   // instead of 15898
}

func _fixRewardsDrift7928900() {
	key := []byte("_fixRewards7928900_")
	if state.ReadUint32(key) == 0 {

		for _, participant := range participantsFixDoubleDelegationReward {
			addressBytes, err := hex.DecodeString(participant.address)
			if err != nil {
				panic(fmt.Errorf("cannot parse %s , err %s", participant.address, err))
			}
			wrongRewardValue := state.ReadUint64(_formatCumulativeParticipationReward(addressBytes))
			state.WriteUint64(_formatCumulativeParticipationReward(addressBytes), uint64(participant.reward))
			correctRewardValue := state.ReadUint64(_formatCumulativeParticipationReward(addressBytes))
			fmt.Printf("elections fix rewards: Participant %s reward changed from %d to %d\n", participant.address, wrongRewardValue, correctRewardValue)
		}

		for _, guardian := range guardiansFixDoubleDelegationReward {
			addressBytes, err := hex.DecodeString(guardian.address)
			if err != nil {
				panic(fmt.Errorf("cannot parse %s , err %s", guardian.address, err))
			}
			wrongRewardValue := state.ReadUint64(_formatCumulativeGuardianExcellenceReward(addressBytes))
			state.WriteUint64(_formatCumulativeGuardianExcellenceReward(addressBytes), uint64(guardian.reward))
			correctRewardValue := state.ReadUint64(_formatCumulativeGuardianExcellenceReward(addressBytes))
			fmt.Printf("elections fix rewards: Guardian %s reward changed from %d to %d\n", guardian.address, wrongRewardValue, correctRewardValue)
		}

		state.WriteUint32(key, 1)
	} else {
		panic(fmt.Sprintf("cannot fix rewards anymore"))
	}
}

var doubleDelegators = []string{
	"aaa020747c3f27035a803a2a9b577e76ed5cdfc7",
	"e933cedb1d7772ab3ca6ca8c173cc6b6ad61bb5f",
	"d5db86180abb0300334347a6a57bd318ffa7aebc",
	"9e912ba1ce059ceca9499ec9ec703b12d32cb50c",
	"e4f60ade67862d6604cc7464621bc7ac17e75841",
	"a39fc2c9c437f2e56901ccc6bd18ee1100c82686",
	"aa1a4565f2d875995d85e8d52e7193c666e20c04",
	"63cad78066b28c58f29f58a4f55827b2c2259776",
	"fa76362c7937b02018abd99c04333d3b62ff7f3d",
	"960ac2fd49b2088cfbb385fed12adb4d78429928",
	"f061c6acc642676914aa7139abc89fbf97a06112",
	"606feb20c03a797a42390163dedd1d45297af73f",
	"0a91147313b82fdb20c853646e829b8d32a9fdb8",
	"22afe11457c368ee1b0314477f0538bfb44843af",
}

func _fixDelegatorState7928900() {
	key := []byte("_fixDelegatorState_7928900_")
	if state.ReadUint32(key) == 0 {

		doubleDelegatorMap := make(map[[20]byte]bool, len(doubleDelegators))
		for _, delegator := range doubleDelegators {
			addressBytes, err := hex.DecodeString(delegator)
			if err != nil {
				panic(fmt.Errorf("cannot parse %s, err %s", delegator, err))
			}
			doubleDelegatorMap[_addressSliceToArray(addressBytes)] = true
		}

		numOfDelegators := _getNumberOfDelegators()
		newNumofDelegators := numOfDelegators

		for i := 0; i < newNumofDelegators; i++ {
			delegator := _getDelegatorAtIndex(i)
			if doubleDelegatorMap[delegator] {
				_setDelegatorAtIndex(i, state.ReadBytes(_formatDelegatorIterator(newNumofDelegators-1)))
				fmt.Printf("elections fix delegators: Delegator pointer at %d is duplicate moving the pointer from %d instead\n", i, newNumofDelegators-1)
				delete(doubleDelegatorMap, delegator)
				newNumofDelegators--
			}
		}

		fmt.Printf("elections fix delegators: Removing un-needed pointers from %d to %d\n", newNumofDelegators, numOfDelegators)
		for i := newNumofDelegators; i < numOfDelegators; i++ {
			state.Clear(_formatDelegatorIterator(newNumofDelegators))
		}
		_setNumberOfDelegators(newNumofDelegators)
		fmt.Printf("elections fix delegators: New number of Delegations %d\n", _getNumberOfDelegators())

		state.WriteUint32(key, 1)
	} else {
		panic(fmt.Sprintf("cannot fix delegate state for double delegations anymore"))
	}
}

// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

/***
 * Guardians
 */
func _getGuardians() map[[20]byte]bool {
	numOfGuardians := _getNumberOfGuardians()
	guardians := make(map[[20]byte]bool, numOfGuardians)
	for i := 0; i < numOfGuardians; i++ {
		guardians[_getGuardianAtIndex(i)] = true
	}
	return guardians
}

func _setGuardians(guardians [][20]byte) {
	numOfGuardians := len(guardians)
	_setNumberOfGuardians(numOfGuardians)
	for i := 0; i < numOfGuardians; i++ {
		_setGuardianAtIndex(i, guardians[i][:])
		state.WriteUint32(_formatGuardian(guardians[i][:]), 1)
	}
}

func _clearGuardians() {
	numOfGuardians := _getNumberOfGuardians()
	for i := 0; i < numOfGuardians; i++ {
		g := _getGuardianAtIndex(i)
		guardian := g[:]
		state.Clear(_formatGuardian(guardian))
		state.Clear(_formatGuardianIterator(i))
		state.Clear(_formatGuardianCandidateKey(guardian))
		state.Clear(_formatGuardianStakeKey(guardian))
		state.Clear(_formatGuardianVoteBlockNumberKey(guardian))
	}
	_setNumberOfGuardians(0)
}

func _isGuardian(guardian [20]byte) bool {
	return state.ReadUint32(_formatGuardian(guardian[:])) != 0
}

/***
 * Guardians - data struct
 */
func _formatNumberOfGuardians() []byte {
	return []byte("Guardians_Count")
}

func _getNumberOfGuardians() int {
	return int(state.ReadUint32(_formatNumberOfGuardians()))
}

func _setNumberOfGuardians(numberOfGuardians int) {
	state.WriteUint32(_formatNumberOfGuardians(), uint32(numberOfGuardians))
}

func _formatGuardianIterator(num int) []byte {
	return []byte(fmt.Sprintf("Guardian_Address_%d", num))
}

func _getGuardianAtIndex(index int) [20]byte {
	return _addressSliceToArray(state.ReadBytes(_formatGuardianIterator(index)))
}

func _setGuardianAtIndex(index int, guardian []byte) {
	state.WriteBytes(_formatGuardianIterator(index), guardian)
}

func _formatGuardian(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_%s", hex.EncodeToString(guardian)))
}

func _formatGuardianStakeKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_%s_Stake", hex.EncodeToString(guardian)))
}

func getGuardianStake(guardian []byte) uint64 {
	return state.ReadUint64(_formatGuardianStakeKey(guardian))
}

func _setGuardianStake(guardian []byte, stake uint64) {
	state.WriteUint64(_formatGuardianStakeKey(guardian), stake)
}

func _formatGuardianVoteBlockNumberKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_%s_VoteAt", hex.EncodeToString(guardian)))
}

func _getGuardianVoteBlockNumber(guardian []byte) uint64 {
	return state.ReadUint64(_formatGuardianVoteBlockNumberKey(guardian))
}

func _setGuardianVoteBlockNumber(guardian []byte, blockNumber uint64) {
	state.WriteUint64(_formatGuardianVoteBlockNumberKey(guardian), blockNumber)
}

func _formatGuardianCandidateKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_%s_Candidates", hex.EncodeToString(guardian)))
}

func _getCandidates(guardian []byte) [][20]byte {
	candidates := state.ReadBytes(_formatGuardianCandidateKey(guardian))
	numCandidate := len(candidates) / 20
	candidatesList := make([][20]byte, numCandidate)
	for i := 0; i < numCandidate; i++ {
		copy(candidatesList[i][:], candidates[i*20:i*20+20])
	}
	return candidatesList
}

func _setCandidates(guardian []byte, candidateList [][20]byte) {
	candidates := make([]byte, 0, len(candidateList)*20)
	for _, v := range candidateList {
		candidates = append(candidates, v[:]...)
	}

	state.WriteBytes(_formatGuardianCandidateKey(guardian), candidates)
}

func _formatGuardianVoteWeightKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_%s_Weight", hex.EncodeToString(guardian)))
}

func getGuardianVotingWeight(guardian []byte) uint64 {
	return state.ReadUint64(_formatGuardianVoteWeightKey(guardian))
}

func _setGuardianVotingWeight(guardian []byte, weight uint64) {
	state.WriteUint64(_formatGuardianVoteWeightKey(guardian), weight)
}

// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

/***
 * Helpers
 */
func _addressSliceToArray(a []byte) [20]byte {
	var array [20]byte
	copy(array[:], a)
	return array
}

func _isAfterElectionMirroring(blockNumber uint64) bool {
	return blockNumber > getMirroringEndBlockNumber()
}

func _mirrorPeriodValidator() {
	currentBlock := ethereum.GetBlockNumber()
	if _getVotingProcessState() != "" && _isAfterElectionMirroring(currentBlock) {
		panic(fmt.Errorf("current block number (%d) indicates mirror period for election (%d) has ended, resubmit next election", currentBlock, _getCurrentElectionBlockNumber()))
	}
}

// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

// helpers for avoiding reliance on strings throughout the system
const CONTRACT_NAME = "_Elections"
const METHOD_GET_ELECTED_VALIDATORS = "getElectedValidatorsOrbsAddress"

// parameters
var DELEGATION_NAME = "Delegate"
var DELEGATION_BY_TRANSFER_NAME = "Transfer"
var DELEGATION_BY_TRANSFER_VALUE = big.NewInt(70000000000000000)
var ETHEREUM_STAKE_FACTOR = big.NewInt(1000000000000000000)
var VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS = uint64(545)
var VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS = uint64(45500)
var ELECTION_PERIOD_LENGTH_IN_BLOCKS = uint64(20000)
var TRANSITION_PERIOD_LENGTH_IN_BLOCKS = uint64(1)
var FIRST_ELECTION_BLOCK = uint64(7528900)
var MAX_ELECTED_VALIDATORS = 22
var MIN_ELECTED_VALIDATORS = 7
var VOTE_OUT_WEIGHT_PERCENT = uint64(70)

var NANOS = 1000 * 1000 * 1000
var ELECTION_PERIOD_LENGTH_IN_NANOS = uint64(3 * 24 * 60 * 60 * NANOS)
var MIRROR_PERIOD_LENGTH_IN_NANOS = uint64(2 * 60 * NANOS)

func _init() {
}

// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

/***
 * Mirror : transfer, delegate
 */
type Transfer struct {
	From  [20]byte
	To    [20]byte
	Value *big.Int
}

func mirrorDelegationByTransfer(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Transfer{}
	eventBlockNumber, eventBlockTxIndex := ethereum.GetTransactionLog(getTokenEthereumContractAddress(), getTokenAbi(), hexEncodedEthTxHash, DELEGATION_BY_TRANSFER_NAME, e)

	if DELEGATION_BY_TRANSFER_VALUE.Cmp(e.Value) != 0 {
		panic(fmt.Errorf("mirrorDelegateByTransfer from %v to %v failed since %d is wrong delegation value", e.From, e.To, e.Value.Uint64()))
	}

	_mirrorDelegationData(e.From[:], e.To[:], eventBlockNumber, eventBlockTxIndex, DELEGATION_BY_TRANSFER_NAME)
}

type Delegate struct {
	Delegator [20]byte
	To        [20]byte
}

func mirrorDelegation(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Delegate{}
	eventBlockNumber, eventBlockTxIndex := ethereum.GetTransactionLog(getVotingEthereumContractAddress(), getVotingAbi(), hexEncodedEthTxHash, DELEGATION_NAME, e)

	_mirrorDelegationData(e.Delegator[:], e.To[:], eventBlockNumber, eventBlockTxIndex, DELEGATION_NAME)
}

func _mirrorDelegationData(delegator []byte, agent []byte, eventBlockNumber uint64, eventBlockTxIndex uint32, eventName string) {
	electionBlockNumber := _getCurrentElectionBlockNumber()
	if eventBlockNumber > electionBlockNumber {
		panic(fmt.Errorf("delegate with medthod %s from %v to %v failed since it happened in block number %d which is after election date (%d), resubmit next election",
			eventName, delegator, agent, eventBlockNumber, electionBlockNumber))
	}
	stateMethod := state.ReadString(_formatDelegatorMethod(delegator))
	stateBlockNumber := uint64(0)
	if stateMethod == DELEGATION_NAME && eventName == DELEGATION_BY_TRANSFER_NAME {
		panic(fmt.Errorf("delegate with medthod %s from %v to %v failed since already have delegation with method %s",
			eventName, delegator, agent, stateMethod))
	} else if stateMethod == DELEGATION_BY_TRANSFER_NAME && eventName == DELEGATION_NAME {
		stateBlockNumber = eventBlockNumber
	} else if stateMethod == eventName {
		stateBlockNumber = state.ReadUint64(_formatDelegatorBlockNumberKey(delegator))
		stateBlockTxIndex := state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegator))
		if stateBlockNumber > eventBlockNumber || (stateBlockNumber == eventBlockNumber && stateBlockTxIndex >= eventBlockTxIndex) {
			panic(fmt.Errorf("delegate from %v to %v with block-height %d and tx-index %d failed since current delegation is from block-height %d and tx-index %d",
				delegator, agent, eventBlockNumber, eventBlockTxIndex, stateBlockNumber, stateBlockTxIndex))
		}
	}

	if stateBlockNumber == 0 { // new delegator
		numOfDelegators := _getNumberOfDelegators()
		_setDelegatorAtIndex(numOfDelegators, delegator)
		_setNumberOfDelegators(numOfDelegators + 1)
	}
	emptyAddr := [20]byte{}
	if bytes.Equal(delegator, agent) {
		agent = emptyAddr[:]
	}

	state.WriteBytes(_formatDelegatorAgentKey(delegator), agent)
	state.WriteUint64(_formatDelegatorBlockNumberKey(delegator), eventBlockNumber)
	state.WriteUint32(_formatDelegatorBlockTxIndexKey(delegator), eventBlockTxIndex)
	state.WriteString(_formatDelegatorMethod(delegator), eventName)
}

/***
 * Delegators - Data struct
 */
func _formatNumberOfDelegators() []byte {
	return []byte("Delegator_Address_Count")
}

func _getNumberOfDelegators() int {
	return int(state.ReadUint32(_formatNumberOfDelegators()))
}

func _setNumberOfDelegators(numberOfDelegators int) {
	state.WriteUint32(_formatNumberOfDelegators(), uint32(numberOfDelegators))
}

func _getDelegatorAtIndex(index int) [20]byte {
	return _addressSliceToArray(state.ReadBytes(_formatDelegatorIterator(index)))
}

func _setDelegatorAtIndex(index int, delegator []byte) {
	state.WriteBytes(_formatDelegatorIterator(index), delegator)
}

func _formatDelegatorIterator(num int) []byte {
	return []byte(fmt.Sprintf("Delegator_Address_%d", num))
}

func _getDelegatorGuardian(delegator []byte) [20]byte {
	return _addressSliceToArray(state.ReadBytes(_formatDelegatorAgentKey(delegator)))
}

func _formatDelegatorAgentKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Delegator_%s_Agent", hex.EncodeToString(delegator)))
}

func _formatDelegatorBlockNumberKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Delegator_%s_BlockNumber", hex.EncodeToString(delegator)))
}

func _formatDelegatorBlockTxIndexKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Delegator_%s_BlockTxIndex", hex.EncodeToString(delegator)))
}

func _formatDelegatorMethod(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Delegator_%s_Method", hex.EncodeToString(delegator)))
}

func _formatDelegatorStakeKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Delegator_%s_Stake", hex.EncodeToString(delegator)))
}

// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

/***
 * Rewards.
 * Rewards constants are annual!!
 */

var ELECTION_PARTICIPATION_MAX_REWARD = uint64(60000000)
var ELECTION_PARTICIPATION_MAX_STAKE_REWARD_PERCENT = uint64(8)
var ELECTION_GUARDIAN_EXCELLENCE_MAX_REWARD = uint64(40000000)
var ELECTION_GUARDIAN_EXCELLENCE_MAX_STAKE_REWARD_PERCENT = uint64(10)
var ELECTION_GUARDIAN_EXCELLENCE_MAX_NUMBER = 10
var ELECTION_VALIDATOR_INTRODUCTION_REWARD = uint64(1000000)
var ELECTION_VALIDATOR_MAX_STAKE_REWARD_PERCENT = uint64(4)
var ANNUAL_TO_ELECTION_FACTOR = uint64(11723)

func _processRewards(totalVotes uint64, elected [][20]byte, participants [][20]byte, participantStakes map[[20]byte]uint64, guardiansAccumulatedStake map[[20]byte]uint64) {
	_processRewardsParticipants(totalVotes, participants, participantStakes)
	_processRewardsGuardians(totalVotes, guardiansAccumulatedStake)
	_processRewardsValidators(elected)
}

func _processRewardsParticipants(totalVotes uint64, participants [][20]byte, participantStakes map[[20]byte]uint64) {
	totalReward := _maxRewardForGroup(ELECTION_PARTICIPATION_MAX_REWARD, totalVotes, ELECTION_PARTICIPATION_MAX_STAKE_REWARD_PERCENT)
	fmt.Printf("elections %10d rewards: %d participants total reward is %d \n", getCurrentElectionBlockNumber(), len(participantStakes), totalReward)
	for _, participant := range participants {
		stake := participantStakes[participant]
		reward := safeuint64.Div(safeuint64.Mul(stake, totalReward), totalVotes)
		fmt.Printf("elections %10d rewards: participant %x, stake %d adding %d\n", getCurrentElectionBlockNumber(), participant, stake, reward)
		_addCumulativeParticipationReward(participant[:], reward)
	}
}

func _processRewardsGuardians(totalVotes uint64, guardiansAccumulatedStake map[[20]byte]uint64) {
	fmt.Printf("elections %10d rewards: there are %d guardians with total reward is %d - choosing %d top guardians\n",
		getCurrentElectionBlockNumber(), len(guardiansAccumulatedStake), totalVotes, ELECTION_GUARDIAN_EXCELLENCE_MAX_NUMBER)
	topGuardians, totalTopVotes := _getTopGuardians(guardiansAccumulatedStake)
	fmt.Printf("elections %10d rewards: top %d guardians with total vote is now %d \n", getCurrentElectionBlockNumber(), len(topGuardians), totalTopVotes)

	_setExcellenceProgramGuardians(topGuardians)
	totalReward := _maxRewardForGroup(ELECTION_GUARDIAN_EXCELLENCE_MAX_REWARD, totalTopVotes, ELECTION_GUARDIAN_EXCELLENCE_MAX_STAKE_REWARD_PERCENT)
	fmt.Printf("elections %10d rewards: guardians total reward is %d \n", getCurrentElectionBlockNumber(), totalReward)
	for _, guardian := range topGuardians {
		reward := safeuint64.Div(safeuint64.Mul(guardian.vote, totalReward), totalTopVotes)
		fmt.Printf("elections %10d rewards: guardian %x, stake %d adding %d\n", getCurrentElectionBlockNumber(), guardian.address, guardian.vote, reward)
		_addCumulativeGuardianExcellenceReward(guardian.address[:], reward)
	}
}

func _processRewardsValidators(elected [][20]byte) {
	electionValidatorIntroduction := safeuint64.Div(safeuint64.Mul(ELECTION_VALIDATOR_INTRODUCTION_REWARD, 100), ANNUAL_TO_ELECTION_FACTOR)
	validatorsStake := _getValidatorsStake()
	fmt.Printf("elections %10d rewards: %d validadator introduction reward %d\n", getCurrentElectionBlockNumber(), len(validatorsStake), electionValidatorIntroduction)
	for _, elected := range elected {
		stake := validatorsStake[elected]
		reward := safeuint64.Add(electionValidatorIntroduction, safeuint64.Div(safeuint64.Mul(stake, ELECTION_VALIDATOR_MAX_STAKE_REWARD_PERCENT), ANNUAL_TO_ELECTION_FACTOR))
		fmt.Printf("elections %10d rewards: validator %x, stake %d adding %d\n", getCurrentElectionBlockNumber(), elected, stake, reward)
		_addCumulativeValidatorReward(elected[:], reward)
	}
}

func _getValidatorsStake() (validatorsStake map[[20]byte]uint64) {
	numOfValidators := _getNumberOfValidators()
	validatorsStake = make(map[[20]byte]uint64, numOfValidators)
	for i := 0; i < numOfValidators; i++ {
		validator := _getValidatorEthereumAddressAtIndex(i)
		stake := getValidatorStake(validator[:])
		validatorsStake[validator] = stake
		fmt.Printf("elections %10d rewards: validator %x, stake %d\n", getCurrentElectionBlockNumber(), validator, stake)
	}
	return
}

func _maxRewardForGroup(upperMaximum, totalVotes, percent uint64) uint64 {
	upperMaximumPerElection := safeuint64.Div(safeuint64.Mul(upperMaximum, 100), ANNUAL_TO_ELECTION_FACTOR)
	calcMaximumPerElection := safeuint64.Div(safeuint64.Mul(totalVotes, percent), ANNUAL_TO_ELECTION_FACTOR)
	fmt.Printf("elections %10d rewards: uppperMax %d vs. %d = totalVotes %d * percent %d / number of annual election \n", getCurrentElectionBlockNumber(), upperMaximumPerElection, calcMaximumPerElection, totalVotes, percent)
	if calcMaximumPerElection < upperMaximumPerElection {
		return calcMaximumPerElection
	}
	return upperMaximumPerElection
}

func _formatCumulativeParticipationReward(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Participant_CumReward_%s", hex.EncodeToString(delegator)))
}

func getCumulativeParticipationReward(delegator []byte) uint64 {
	return state.ReadUint64(_formatCumulativeParticipationReward(delegator))
}

func _addCumulativeParticipationReward(delegator []byte, reward uint64) {
	_addCumulativeReward(_formatCumulativeParticipationReward(delegator), reward)
}

func _formatCumulativeGuardianExcellenceReward(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_CumReward_%s", hex.EncodeToString(guardian)))
}

func getCumulativeGuardianExcellenceReward(guardian []byte) uint64 {
	return state.ReadUint64(_formatCumulativeGuardianExcellenceReward(guardian))
}

func _addCumulativeGuardianExcellenceReward(guardian []byte, reward uint64) {
	_addCumulativeReward(_formatCumulativeGuardianExcellenceReward(guardian), reward)
}

func _formatCumulativeValidatorReward(validator []byte) []byte {
	return []byte(fmt.Sprintf("Vaidator_CumReward_%s", hex.EncodeToString(validator)))
}

func getCumulativeValidatorReward(validator []byte) uint64 {
	return state.ReadUint64(_formatCumulativeValidatorReward(validator))
}

func _addCumulativeValidatorReward(validator []byte, reward uint64) {
	_addCumulativeReward(_formatCumulativeValidatorReward(validator), reward)
}

func _addCumulativeReward(key []byte, reward uint64) {
	sumReward := safeuint64.Add(state.ReadUint64(key), reward)
	state.WriteUint64(key, sumReward)
}

func _formatExcellenceProgramGuardians() []byte {
	return []byte("Excellence_Program_Guardians")
}

func getExcellenceProgramGuardians() []byte {
	return state.ReadBytes(_formatExcellenceProgramGuardians())
}

func _setExcellenceProgramGuardians(guardians guardianArray) {
	guardiansForSave := make([]byte, 0, len(guardians)*20)
	for _, guardian := range guardians {
		guardiansForSave = append(guardiansForSave, guardian.address[:]...)
	}
	state.WriteBytes(_formatExcellenceProgramGuardians(), guardiansForSave)
}

/***
 * Rewards: Sort top guardians using sort.Interface
 */
func _getTopGuardians(guardiansAccumulatedStake map[[20]byte]uint64) (topGuardiansStake guardianArray, totalVotes uint64) {
	totalVotes = uint64(0)

	guardianList := make(guardianArray, 0, len(guardiansAccumulatedStake))
	for guardian, vote := range guardiansAccumulatedStake {
		guardianList = append(guardianList, &guardianVote{guardian, vote})
	}
	sort.Sort(guardianList)

	i := 0
	for i = 0; i < len(guardianList) && i < ELECTION_GUARDIAN_EXCELLENCE_MAX_NUMBER; i++ {
		fmt.Printf("elections %10d rewards: top guardian %x, has %d votes\n", _getCurrentElectionBlockNumber(), guardianList[i].address, guardianList[i].vote)
		totalVotes = safeuint64.Add(totalVotes, guardianList[i].vote)
	}
	for i = ELECTION_GUARDIAN_EXCELLENCE_MAX_NUMBER; i < len(guardianList); i++ {
		if guardianList[i].vote != guardianList[i-1].vote {
			break
		}
		fmt.Printf("elections %10d rewards: top guardian %x, has %d votes\n", _getCurrentElectionBlockNumber(), guardianList[i].address, guardianList[i].vote)
		totalVotes = safeuint64.Add(totalVotes, guardianList[i].vote)
	}
	if i < len(guardianList) {
		return guardianList[0:i], totalVotes
	} else {
		return guardianList, totalVotes
	}
}

type guardianVote struct {
	address [20]byte
	vote    uint64
}
type guardianArray []*guardianVote

func (s guardianArray) Len() int {
	return len(s)
}

func (s guardianArray) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s guardianArray) Less(i, j int) bool {
	return s[i].vote > s[j].vote || (s[i].vote == s[j].vote && bytes.Compare(s[i].address[:], s[j].address[:]) > 0)
}

// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

/***
 * processing
 */
func processVoting() uint64 {
	currentBlock := ethereum.GetBlockNumber()
	if !_isAfterElectionMirroring(currentBlock) {
		panic(fmt.Sprintf("mirror period (%d - %d) did not end (now %d). cannot start processing", _getCurrentElectionBlockNumber(), _getCurrentElectionBlockNumber()+VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS, currentBlock))
	}

	electedValidators := _processVotingStateMachine()
	if electedValidators != nil {
		_setElectedValidators(electedValidators)
		_setCurrentElectionBlockNumber(safeuint64.Add(_getCurrentElectionBlockNumber(), ELECTION_PERIOD_LENGTH_IN_BLOCKS))
		return 1
	} else {
		return 0
	}
}

func _processVotingStateMachine() [][20]byte {
	processState := _getVotingProcessState()
	if processState == "" {
		_getCurrentElectionBlockNumber() // called to make sure the initCurrentElectionBlockNumber was called
		_readValidatorsFromEthereumToState()
		_nextProcessVotingState(VOTING_PROCESS_STATE_GUARDIANS)
		return nil
	} else if processState == VOTING_PROCESS_STATE_GUARDIANS {
		_clearGuardians() // cleanup last elections
		_readGuardiansFromEthereumToState()
		_nextProcessVotingState(VOTING_PROCESS_STATE_VALIDATORS)
		return nil
	} else if processState == VOTING_PROCESS_STATE_VALIDATORS {
		if _collectNextValidatorDataFromEthereum() {
			_nextProcessVotingState(VOTING_PROCESS_STATE_GUARDIANS_DATA)
		}
		return nil
	} else if processState == VOTING_PROCESS_STATE_GUARDIANS_DATA {
		if _collectNextGuardiansDataFromEthereum() {
			_nextProcessVotingState(VOTING_PROCESS_STATE_DELEGATORS)
		}
		return nil
	} else if processState == VOTING_PROCESS_STATE_DELEGATORS {
		if _collectNextDelegatorStakeFromEthereum() {
			_nextProcessVotingState(VOTING_PROCESS_STATE_CALCULATIONS)
		}
		return nil
	} else if processState == VOTING_PROCESS_STATE_CALCULATIONS {
		candidateVotes, totalVotes, participants, participantStakes, guardiansAccumulatedStake := _calculateVotes()
		elected := _processValidatorsSelection(candidateVotes, totalVotes)
		_processRewards(totalVotes, elected, participants, participantStakes, guardiansAccumulatedStake)
		_setVotingProcessState("")
		return elected
	}
	return nil
}

func _nextProcessVotingState(stage string) {
	_setVotingProcessItem(0)
	_setVotingProcessState(stage)
	fmt.Printf("elections %10d: moving to state %s\n", getCurrentElectionBlockNumber(), stage)
}

func _readValidatorsFromEthereumToState() {
	var validators [][20]byte
	ethereum.CallMethodAtBlock(_getCurrentElectionBlockNumber(), getValidatorsEthereumContractAddress(), getValidatorsAbi(), "getValidatorsBytes20", &validators)

	fmt.Printf("elections %10d: from ethereum read %d validators\n", getCurrentElectionBlockNumber(), len(validators))
	_setValidators(validators)
}

func _readGuardiansFromEthereumToState() {
	var guardians [][20]byte
	pos := int64(0)
	pageSize := int64(50)
	for {
		var gs [][20]byte
		ethereum.CallMethodAtBlock(_getCurrentElectionBlockNumber(), getGuardiansEthereumContractAddress(), getGuardiansAbi(), "getGuardiansBytes20", &gs, big.NewInt(pos), big.NewInt(pageSize))
		guardians = append(guardians, gs...)
		if len(gs) < 50 {
			break
		}
		pos += pageSize
	}

	fmt.Printf("elections %10d: from ethereum read %d guardians\n", getCurrentElectionBlockNumber(), len(guardians))
	_setGuardians(guardians)
}

func _collectNextValidatorDataFromEthereum() (isDone bool) {
	nextIndex := _getVotingProcessItem()
	_collectOneValidatorDataFromEthereum(nextIndex)
	nextIndex++
	_setVotingProcessItem(nextIndex)
	return nextIndex >= _getNumberOfValidators()
}

func _collectOneValidatorDataFromEthereum(i int) {
	validator := _getValidatorEthereumAddressAtIndex(i)

	var orbsAddress [20]byte
	ethereum.CallMethodAtBlock(_getCurrentElectionBlockNumber(), getValidatorsRegistryEthereumContractAddress(), getValidatorsRegistryAbi(), "getOrbsAddress", &orbsAddress, validator)
	stake := _getStakeAtElection(validator)

	_setValidatorStake(validator[:], stake)
	_setValidatorOrbsAddress(validator[:], orbsAddress[:])
	fmt.Printf("elections %10d: from ethereum validator %x, stake %d orbsAddress %x\n", getCurrentElectionBlockNumber(), validator, stake, orbsAddress)
}

func _collectNextGuardiansDataFromEthereum() bool {
	nextIndex := _getVotingProcessItem()
	_collectOneGuardianDataFromEthereum(nextIndex)
	nextIndex++
	_setVotingProcessItem(nextIndex)
	return nextIndex >= _getNumberOfGuardians()
}

type Vote struct {
	ValidatorsBytes20 [][20]byte
	BlockNumber       *big.Int
}

func _collectOneGuardianDataFromEthereum(i int) {
	guardian := _getGuardianAtIndex(i)
	stake := uint64(0)
	candidates := [][20]byte{{}}

	out := Vote{}
	ethereum.CallMethodAtBlock(_getCurrentElectionBlockNumber(), getVotingEthereumContractAddress(), getVotingAbi(), "getCurrentVoteBytes20", &out, guardian)
	voteBlockNumber := out.BlockNumber.Uint64()
	if voteBlockNumber != 0 && safeuint64.Add(voteBlockNumber, VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS) > _getCurrentElectionBlockNumber() {
		stake = _getStakeAtElection(guardian)
		candidates = out.ValidatorsBytes20
		voteBlockNumber = out.BlockNumber.Uint64()
		fmt.Printf("elections %10d: from ethereum guardian %x voted at %d, stake %d\n", getCurrentElectionBlockNumber(), guardian, voteBlockNumber, stake)
	} else {
		voteBlockNumber = uint64(0)
		fmt.Printf("elections %10d: from ethereum guardian %x vote is too old, will ignore\n", getCurrentElectionBlockNumber(), guardian)
	}

	_setGuardianStake(guardian[:], stake)
	_setGuardianVoteBlockNumber(guardian[:], voteBlockNumber)
	_setCandidates(guardian[:], candidates)
}

func _collectNextDelegatorStakeFromEthereum() bool {
	nextIndex := _getVotingProcessItem()
	_collectOneDelegatorStakeFromEthereum(nextIndex)
	nextIndex++
	_setVotingProcessItem(nextIndex)
	return nextIndex >= _getNumberOfDelegators()
}

func _collectOneDelegatorStakeFromEthereum(i int) {
	delegator := _getDelegatorAtIndex(i)
	stake := uint64(0)
	if !_isGuardian(delegator) {
		stake = _getStakeAtElection(delegator)
	} else {
		fmt.Printf("elections %10d: from ethereum delegator %x is actually a guardian, will ignore\n", getCurrentElectionBlockNumber(), delegator)
	}
	state.WriteUint64(_formatDelegatorStakeKey(delegator[:]), stake)
	fmt.Printf("elections %10d: from ethereum delegator %x , stake %d\n", getCurrentElectionBlockNumber(), delegator, stake)
}

func _getStakeAtElection(ethAddr [20]byte) uint64 {
	stake := new(*big.Int)
	ethereum.CallMethodAtBlock(_getCurrentElectionBlockNumber(), getTokenEthereumContractAddress(), getTokenAbi(), "balanceOf", stake, ethAddr)
	return ((*stake).Div(*stake, ETHEREUM_STAKE_FACTOR)).Uint64()
}

func _calculateVotes() (candidateVotes map[[20]byte]uint64, totalVotes uint64, participants [][20]byte, participantStakes map[[20]byte]uint64, guardianAccumulatedStakes map[[20]byte]uint64) {
	guardians := _getGuardians()
	guardianStakes := _collectGuardiansStake(guardians)
	delegators, delegatorStakes := _collectDelegatorsStake(guardians)
	guardianToDelegators := _findGuardianDelegators(delegators)
	candidateVotes, totalVotes, participants, participantStakes, guardianAccumulatedStakes = _guardiansCastVotes(guardianStakes, guardianToDelegators, delegatorStakes)
	return
}

func _collectGuardiansStake(guardians map[[20]byte]bool) (guardianStakes map[[20]byte]uint64) {
	guardianStakes = make(map[[20]byte]uint64)
	numOfGuardians := _getNumberOfGuardians()
	for i := 0; i < numOfGuardians; i++ {
		guardian := _getGuardianAtIndex(i)
		voteBlockNumber := _getGuardianVoteBlockNumber(guardian[:])
		if voteBlockNumber != 0 {
			stake := getGuardianStake(guardian[:])
			guardianStakes[guardian] = stake
			fmt.Printf("elections %10d: guardian %x, stake %d\n", getCurrentElectionBlockNumber(), guardian, stake)
		} else {
			fmt.Printf("elections %10d: guardian %x vote is too old, ignoring as guardian \n", getCurrentElectionBlockNumber(), guardian)
		}
	}
	return
}

func _collectDelegatorsStake(guardians map[[20]byte]bool) (delegators [][20]byte, delegatorStakes map[[20]byte]uint64) {
	delegatorStakes = make(map[[20]byte]uint64)
	delegators = make([][20]byte, 0, _getNumberOfDelegators())
	numOfDelegators := _getNumberOfDelegators()
	for i := 0; i < numOfDelegators; i++ {
		delegator := _getDelegatorAtIndex(i)
		if !guardians[delegator] {
			if _, ok := delegatorStakes[delegator]; !ok { //
				stake := state.ReadUint64(_formatDelegatorStakeKey(delegator[:]))
				delegatorStakes[delegator] = stake
				delegators = append(delegators, delegator)
				fmt.Printf("elections %10d: delegator %x, stake %d\n", getCurrentElectionBlockNumber(), delegator, stake)
			}
		} else {
			fmt.Printf("elections %10d: delegator %x ignored as it is also a guardian\n", getCurrentElectionBlockNumber(), delegator)
		}
	}
	return
}

func _findGuardianDelegators(delegators [][20]byte) (guardianToDelegators map[[20]byte][][20]byte) {
	guardianToDelegators = make(map[[20]byte][][20]byte)

	for _, delegator := range delegators {
		guardian := _getDelegatorGuardian(delegator[:])
		if !bytes.Equal(guardian[:], delegator[:]) {
			fmt.Printf("elections %10d: delegator %x, guardian/agent %x\n", getCurrentElectionBlockNumber(), delegator, guardian)
			guardianDelegatorList, ok := guardianToDelegators[guardian]
			if !ok {
				guardianDelegatorList = [][20]byte{}
			}
			guardianDelegatorList = append(guardianDelegatorList, delegator)
			guardianToDelegators[guardian] = guardianDelegatorList
		}
	}
	return
}

func _guardiansCastVotes(guardianStakes map[[20]byte]uint64, guardianDelegators map[[20]byte][][20]byte, delegatorStakes map[[20]byte]uint64) (candidateVotes map[[20]byte]uint64, totalVotes uint64, participants [][20]byte, participantStakes map[[20]byte]uint64, guardainsAccumulatedStakes map[[20]byte]uint64) {
	totalVotes = uint64(0)
	candidateVotes = make(map[[20]byte]uint64)
	participants = make([][20]byte, 0, len(guardianStakes)+len(delegatorStakes))
	participantStakes = make(map[[20]byte]uint64, len(guardianStakes)+len(delegatorStakes))
	guardainsAccumulatedStakes = make(map[[20]byte]uint64, len(guardianStakes))
	numOfGuardians := _getNumberOfGuardians()
	for i := 0; i < numOfGuardians; i++ { // must not range over map as we set to state and order must be fixed
		guardian := _getGuardianAtIndex(i)
		if guardianStake, ok := guardianStakes[guardian]; ok {
			//	for guardian, guardianStake := range guardianStakes {
			participantStakes[guardian] = guardianStake
			participants = append(participants, guardian)
			fmt.Printf("elections %10d: guardian %x, self-voting stake %d\n", getCurrentElectionBlockNumber(), guardian, guardianStake)
			stake := safeuint64.Add(guardianStake, _calculateOneGuardianVoteRecursive(guardian, guardianDelegators, delegatorStakes, &participants, participantStakes))
			guardainsAccumulatedStakes[guardian] = stake
			_setGuardianVotingWeight(guardian[:], stake)
			totalVotes = safeuint64.Add(totalVotes, stake)
			fmt.Printf("elections %10d: guardian %x, voting stake %d\n", getCurrentElectionBlockNumber(), guardian, stake)

			candidateList := _getCandidates(guardian[:])
			for _, candidate := range candidateList {
				fmt.Printf("elections %10d: guardian %x, voted for candidate %x\n", getCurrentElectionBlockNumber(), guardian, candidate)
				candidateVotes[candidate] = safeuint64.Add(candidateVotes[candidate], stake)
			}
		}
	}
	fmt.Printf("elections %10d: total voting stake %d\n", getCurrentElectionBlockNumber(), totalVotes)
	_setTotalStake(totalVotes)
	return
}

// Note : important that first call is to guardian ... otherwise not all delegators will be added to participants
func _calculateOneGuardianVoteRecursive(currentLevelGuardian [20]byte, guardianToDelegators map[[20]byte][][20]byte, delegatorStakes map[[20]byte]uint64, participants *[][20]byte, participantStakes map[[20]byte]uint64) uint64 {
	guardianDelegatorList, ok := guardianToDelegators[currentLevelGuardian]
	currentVotes := delegatorStakes[currentLevelGuardian]
	if ok {
		for _, delegate := range guardianDelegatorList {
			participantStakes[delegate] = delegatorStakes[delegate]
			*participants = append(*participants, delegate)
			currentVotes = safeuint64.Add(currentVotes, _calculateOneGuardianVoteRecursive(delegate, guardianToDelegators, delegatorStakes, participants, participantStakes))
		}
	}
	return currentVotes
}

func _processValidatorsSelection(candidateVotes map[[20]byte]uint64, totalVotes uint64) [][20]byte {
	validators := _getValidators()
	voteOutThreshhold := safeuint64.Div(safeuint64.Mul(totalVotes, VOTE_OUT_WEIGHT_PERCENT), 100)
	fmt.Printf("elections %10d: %d is vote out threshhold\n", getCurrentElectionBlockNumber(), voteOutThreshhold)

	winners := make([][20]byte, 0, len(validators))
	for _, validator := range validators {
		voted, ok := candidateVotes[validator]
		_setValidatorVote(validator[:], voted)
		if !ok || voted < voteOutThreshhold {
			fmt.Printf("elections %10d: elected %x (got %d vote outs)\n", getCurrentElectionBlockNumber(), validator, voted)
			winners = append(winners, validator)
		} else {
			fmt.Printf("elections %10d: candidate %x voted out by %d votes\n", getCurrentElectionBlockNumber(), validator, voted)
		}
	}
	if len(winners) < MIN_ELECTED_VALIDATORS {
		fmt.Printf("elections %10d: not enought validators left after vote using all validators %v\n", getCurrentElectionBlockNumber(), validators)
		return validators
	} else {
		return winners
	}
}

func _formatTotalVotingStakeKey() []byte {
	return []byte("Total_Voting_Weight")
}

func getTotalStake() uint64 {
	return state.ReadUint64(_formatTotalVotingStakeKey())
}

func _setTotalStake(weight uint64) {
	state.WriteUint64(_formatTotalVotingStakeKey(), weight)
}

const VOTING_PROCESS_STATE_VALIDATORS = "validators"
const VOTING_PROCESS_STATE_GUARDIANS = "guardians"
const VOTING_PROCESS_STATE_DELEGATORS = "delegators"
const VOTING_PROCESS_STATE_GUARDIANS_DATA = "voting"
const VOTING_PROCESS_STATE_CALCULATIONS = "calculations"

func _formatVotingProcessStateKey() []byte {
	return []byte("Voting_Process_State")
}

func _getVotingProcessState() string {
	return state.ReadString(_formatVotingProcessStateKey())
}

func _setVotingProcessState(name string) {
	state.WriteString(_formatVotingProcessStateKey(), name)
}

func _formatVotingProcessItemIteratorKey() []byte {
	return []byte("Voting_Process_Item")
}

func _getVotingProcessItem() int {
	return int(state.ReadUint32(_formatVotingProcessItemIteratorKey()))
}

func _setVotingProcessItem(i int) {
	state.WriteUint32(_formatVotingProcessItemIteratorKey(), uint32(i))
}

// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

/***
 * Validators
 */
func _setValidators(validators [][20]byte) {
	numberOfValidators := len(validators)
	_setNumberOfValidators(numberOfValidators)
	for i := 0; i < numberOfValidators; i++ {
		_setValidatorEthereumAddressAtIndex(i, validators[i][:])
	}
}

func _getValidators() (validtors [][20]byte) {
	numOfValidators := _getNumberOfValidators()
	validtors = make([][20]byte, numOfValidators)
	for i := 0; i < numOfValidators; i++ {
		validtors[i] = _getValidatorEthereumAddressAtIndex(i)
	}
	return
}

/***
 * Validators - data struct
 */
func _formatNumberOfValidators() []byte {
	return []byte("Validators_Count")
}

func _getNumberOfValidators() int {
	return int(state.ReadUint32(_formatNumberOfValidators()))
}

func _setNumberOfValidators(numberOfValidators int) {
	state.WriteUint32(_formatNumberOfValidators(), uint32(numberOfValidators))
}

func _formatValidaorIterator(num int) []byte {
	return []byte(fmt.Sprintf("Validator_Address_%d", num))
}

func _getValidatorEthereumAddressAtIndex(index int) [20]byte {
	return _addressSliceToArray(state.ReadBytes(_formatValidaorIterator(index)))
}

func _setValidatorEthereumAddressAtIndex(index int, validator []byte) {
	state.WriteBytes(_formatValidaorIterator(index), validator)
}

func _formatValidatorOrbsAddressKey(validator []byte) []byte {
	return []byte(fmt.Sprintf("Validator_%s_Orbs", hex.EncodeToString(validator)))
}

func _getValidatorOrbsAddress(validator []byte) [20]byte {
	return _addressSliceToArray(state.ReadBytes(_formatValidatorOrbsAddressKey(validator)))
}

func _setValidatorOrbsAddress(validator []byte, orbsAddress []byte) {
	state.WriteBytes(_formatValidatorOrbsAddressKey(validator), orbsAddress)
}

func _formatValidatorStakeKey(validator []byte) []byte {
	return []byte(fmt.Sprintf("Validator_%s_Stake", hex.EncodeToString(validator)))
}

func getValidatorStake(validator []byte) uint64 {
	return state.ReadUint64(_formatValidatorStakeKey(validator))
}

func _setValidatorStake(validator []byte, stake uint64) {
	state.WriteUint64(_formatValidatorStakeKey(validator), stake)
}

func _formatValidatorVoteKey(validator []byte) []byte {
	return []byte(fmt.Sprintf("Validator_%s_Vote", hex.EncodeToString(validator)))
}

func getValidatorVote(validator []byte) uint64 {
	return state.ReadUint64(_formatValidatorVoteKey(validator))
}

func _setValidatorVote(validator []byte, stake uint64) {
	state.WriteUint64(_formatValidatorVoteKey(validator), stake)
}
