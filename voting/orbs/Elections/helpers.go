// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package elections_systemcontract

import (
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/ethereum"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/safemath/safeuint64"
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
	if state.ReadUint32(_formatIsTimeBasedElections()) == 0 {
		fmt.Println("elections : startTimeBasedElections has been called switching to time based elections")

		state.WriteUint32(_formatIsTimeBasedElections(), 1)
	}
}

func _isTimeBasedElections() bool {
	return state.ReadUint32(_formatIsTimeBasedElections()) == 1
}

func _initCurrentElection() {
	if _isTimeBasedElections() {
		if getEffectiveElectionTimeInNanos() == 0 {
			currTime := ethereum.GetBlockTime()
			effectiveElectionTime := safeuint64.Sub(FIRST_ELECTION_TIME_IN_NANOS, getElectionPeriodInNanos())
			if currTime > FIRST_ELECTION_TIME_IN_NANOS {
				timeSinceFirstEver := safeuint64.Sub(currTime, FIRST_ELECTION_TIME_IN_NANOS)
				numberOfFullElections := safeuint64.Div(timeSinceFirstEver, getElectionPeriodInNanos())
				effectiveElectionTime = safeuint64.Add(FIRST_ELECTION_TIME_IN_NANOS, safeuint64.Mul(numberOfFullElections, getElectionPeriodInNanos()))
			}
			_setElectedValidatorsTimeInNanosAtIndex(0, effectiveElectionTime)
		}
	} else {
		_initCurrentElectionBlockNumber()
	}
}
