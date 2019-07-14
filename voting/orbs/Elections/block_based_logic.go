package elections_systemcontract

import (
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/ethereum"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/safemath/safeuint64"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
)

func getElectionPeriod() uint64 {
	return ELECTION_PERIOD_LENGTH_IN_BLOCKS
}

func _formatElectionBlockNumberKey() []byte {
	return []byte("Election_Block_Number")
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

func _isProcessingPeriodBlockBased() uint32 {
	currentBlockNumber := getCurrentEthereumBlockNumber()
	processStartBlockNumber := getProcessingStartBlockNumber()

	if currentBlockNumber >= processStartBlockNumber {
		return 1
	}
	return 0
}
