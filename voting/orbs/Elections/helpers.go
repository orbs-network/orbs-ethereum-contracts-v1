// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package elections_systemcontract

import (
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
)

/***
 * Helpers
 */
func _addressSliceToArray(a []byte) [20]byte {
	var array [20]byte
	copy(array[:], a)
	return array
}

func _formatIsTimeBasedElections() []byte {
	return []byte("Is_Time_Based_Elections")
}

func startTimeBasedElections() {
	if state.ReadUint64(_formatIsTimeBasedElections()) == 0 {

	}
	state.WriteUint32(_formatIsTimeBasedElections(), 1)
}

func _isTimeBasedElections() bool {
	return state.ReadUint64(_formatIsTimeBasedElections()) == 1
}

//func _isAfterElectionMirroring(blockNumber uint64) bool {
//	return blockNumber > getMirroringEndBlockNumber()
//}
//
//func _mirrorPeriodValidator() {
//	currentBlock := ethereum.GetBlockNumber()
//	if _getVotingProcessState() != "" && _isAfterElectionMirroring(currentBlock) {
//		panic(fmt.Errorf("current block number (%d) indicates mirror period for election (%d) has ended, resubmit next election", currentBlock, initCurrentElectionBlockNumber()))
//	}
//}
