package main

import (
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
)

var PUBLIC = sdk.Export(updateElectionResults, getElectionResults, getElectionResultsByBlockNumber, getElectionResultsByIndex, getElectionResultsBlockNumberByIndex, getNumberOfElections)
var SYSTEM = sdk.Export(_init)

func _init() {
}

func updateElectionResults(elected []byte, blockNumber uint64) {
	index := getNumberOfElections()
	if getElectionResultsBlockNumberByIndex(index) > blockNumber {
		panic(fmt.Sprintf("Election results rejected as new election happend at block %d which is older than last election %d",
			blockNumber, getElectionResultsBlockNumberByIndex(index)))
	}
	index++
	_setElectionResultsBlockNumberAtIndex(index, blockNumber)
	_setElectionResultsAtIndex(index, elected)
	_setNumberOfElections(index)
}

func getElectionResults() []byte {
	index := getNumberOfElections()
	return getElectionResultsByIndex(index)
}

func getElectionResultsByBlockNumber(blockNumber uint64) []byte {
	numberOfElections := getNumberOfElections()
	for i := numberOfElections; i > 0; i-- {
		if getElectionResultsBlockNumberByIndex(i) < blockNumber {
			return getElectionResultsByIndex(i)
		}
	}
	return _getDefaultElectionResults()
}

func _getDefaultElectionResults() []byte {
	defElected := [20]byte{0x10} // TODO v1 get defaults
	return defElected[:]
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

func _formatElectionsBlockNumber(index uint32) []byte {
	return []byte(fmt.Sprintf("Elections_%d_BlockNumber", index))
}

func getElectionResultsBlockNumberByIndex(index uint32) uint64 {
	return state.ReadUint64(_formatElectionsBlockNumber(index))
}

func _setElectionResultsBlockNumberAtIndex(index uint32, blockNumber uint64) {
	state.WriteUint64(_formatElectionsBlockNumber(index), blockNumber)
}

func _formatElectionValidator(index uint32) []byte {
	return []byte(fmt.Sprintf("Elections_%d_Validators", index))
}

func getElectionResultsByIndex(index uint32) []byte {
	return state.ReadBytes(_formatElectionValidator(index))
}

func _setElectionResultsAtIndex(index uint32, elected []byte) {
	state.WriteBytes(_formatElectionValidator(index), elected)
}
