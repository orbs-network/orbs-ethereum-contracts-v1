package main

import (
	. "github.com/orbs-network/orbs-contract-sdk/go/testing/unit"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestOrbsElectionResultsContract_updateElectionResults(t *testing.T) {
	currIndex := uint32(2)
	currBlockNumber := uint64(10000)
	currElected := []byte{0x01}
	newBlockNumber := uint64(20000)
	newElected := [][20]byte{{0x02}}

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		_setElectedValidatorsBlockNumberAtIndex(currIndex, currBlockNumber)
		_setElectedValidatorsAtIndex(currIndex, currElected)
		_setNumberOfElections(currIndex)

		// call
		_setElectedValidators(newElected, newBlockNumber)

		// assert
		require.EqualValues(t, currIndex+1, getNumberOfElections())
		require.EqualValues(t, newBlockNumber, getElectedValidatorsBlockNumberByIndex(currIndex+1))
		require.EqualValues(t, _concatElectedAddresses(newElected), getElectedValidatorsByIndex(currIndex+1))
		require.EqualValues(t, currBlockNumber, getElectedValidatorsBlockNumberByIndex(currIndex))
		require.EqualValues(t, currElected, getElectedValidatorsByIndex(currIndex))
	})
}

func TestOrbsElectionResultsContract_updateElectionResults_Empty(t *testing.T) {
	newBlockNumber := uint64(20000)
	newElected := [][20]byte{{0x02}}

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// call
		_setElectedValidators(newElected, newBlockNumber)

		// assert
		require.EqualValues(t, 1, getNumberOfElections())
		require.EqualValues(t, newBlockNumber, getElectedValidatorsBlockNumberByIndex(1))
		require.EqualValues(t, _concatElectedAddresses(newElected), getElectedValidatorsByIndex(1))
	})
}

func TestOrbsElectionResultsContract_updateElectionResults_WrongBlockNumber(t *testing.T) {
	currIndex := uint32(2)
	currBlockNumber := uint64(10000)
	currElected := []byte{0x01}
	newBlockNumber := uint64(500)
	newElected := [][20]byte{{0x02}}

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		_setElectedValidatorsBlockNumberAtIndex(currIndex, currBlockNumber)
		_setElectedValidatorsAtIndex(currIndex, currElected)
		_setNumberOfElections(currIndex)

		// call
		require.Panics(t, func() {
			_setElectedValidators(newElected, newBlockNumber)
		}, "should panic because newer blocknumber is in past")
	})
}

func TestOrbsElectionResultsContract_getElectionResultsByBlockNumber_getSeveralValues(t *testing.T) {
	blockNumber1 := uint64(10000)
	elected1 := []byte{0x01}
	blockNumber2 := uint64(20000)
	elected2 := []byte{0x02}
	blockNumber3 := uint64(30000)
	elected3 := []byte{0x03}

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		_setElectedValidatorsBlockNumberAtIndex(1, blockNumber1)
		_setElectedValidatorsAtIndex(1, elected1)
		_setElectedValidatorsBlockNumberAtIndex(2, blockNumber2)
		_setElectedValidatorsAtIndex(2, elected2)
		_setElectedValidatorsBlockNumberAtIndex(3, blockNumber3)
		_setElectedValidatorsAtIndex(3, elected3)
		_setNumberOfElections(3)

		// call
		foundElected1 := getElectedValidatorsByBlockNumber(blockNumber1 + 1)
		foundElected2 := getElectedValidatorsByBlockNumber(blockNumber2 + 5000)
		foundElected3 := getElectedValidatorsByBlockNumber(blockNumber3 + 1000000)
		foundElected0 := getElectedValidatorsByBlockNumber(5)

		// assert
		require.EqualValues(t, elected1, foundElected1)
		require.EqualValues(t, elected2, foundElected2)
		require.EqualValues(t, elected3, foundElected3)
		require.EqualValues(t, _getDefaultElectionResults(), foundElected0)
	})
}
