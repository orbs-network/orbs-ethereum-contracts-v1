package main

import (
	"encoding/hex"
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/state"
	. "github.com/orbs-network/orbs-contract-sdk/go/testing/unit"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestOrbsVotingContract_mirrorDelegation(t *testing.T) {
	txHex := "0xabcd"
	delegatorAddr := [20]byte{0x01}
	agentAddr := [20]byte{0x02}

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, "Delegate", func(out interface{}) {
			v := out.(*Delegate)
			v.Delegator = delegatorAddr
			v.Agent = agentAddr
		})

		//// this is what we expect to be called
		//m.MockServiceCallMethod(getTokenContract(), "asbMint", nil, orbsUserAddress[:], uint64(17))
		//
		// call
		mirrorDelegation(txHex)

		// assert
		m.VerifyMocks()
		require.EqualValues(t, agentAddr, state.ReadBytesByKey(fmt.Sprintf("StakeHolder_%s_Agent", hex.EncodeToString(delegatorAddr[:]))))
	})

}
