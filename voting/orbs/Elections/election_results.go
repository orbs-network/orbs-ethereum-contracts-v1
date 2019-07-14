// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package elections_systemcontract

import (
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/env"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/safemath/safeuint64"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
)

/*****
 * Election results
 */
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

func isElectionOverdue() uint32 {
	processStartBlockNumber := getProcessingStartBlockNumber()
	currentBlockNumber := getCurrentEthereumBlockNumber()

	if processStartBlockNumber == 0 || currentBlockNumber >= safeuint64.Add(processStartBlockNumber, 600) {
		return 1
	}
	return 0
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

func _setElectedValidators(elected [][20]byte, electionBlockNumber uint64) {
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
		// TODO NOAM remove this or finde other way don't use getcurr
		//		fmt.Printf("elections %10d: translate %x to %x\n", getCurrentElectionBlockNumber(), elected[i][:], electedOrbsAddress)
		electedForSave = append(electedForSave, electedOrbsAddress[:]...)
	}
	return electedForSave
}

func initCurrentElectionBlockNumber() uint64 {
	currentElectionBlockNumber := getCurrentElectionBlockNumber()
	if currentElectionBlockNumber == 0 {
		currBlock := getCurrentEthereumBlockNumber()
		if currBlock < FIRST_ELECTION_BLOCK {
			_setCurrentElectionBlockNumber(FIRST_ELECTION_BLOCK)
			return FIRST_ELECTION_BLOCK
		} else {
			blocksSinceFirstEver := safeuint64.Sub(currBlock, FIRST_ELECTION_BLOCK)
			blocksSinceStartOfAnElection := safeuint64.Mod(blocksSinceFirstEver, getElectionPeriod())
			blocksUntilNextElection := safeuint64.Sub(getElectionPeriod(), blocksSinceStartOfAnElection)
			nextElectionBlock := safeuint64.Add(currBlock, blocksUntilNextElection)
			_setCurrentElectionBlockNumber(nextElectionBlock)
			return nextElectionBlock
		}
	}
	return currentElectionBlockNumber
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

func _formatEffectiveElectionTimeKey() []byte {
	return []byte("Effective_Election_Time")
}

func _setEffectiveElectionTimeInNanos(time uint64) {
	state.WriteUint64(_formatEffectiveElectionTimeKey(), time)
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
