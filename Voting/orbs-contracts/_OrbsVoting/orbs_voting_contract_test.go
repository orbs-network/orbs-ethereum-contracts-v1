package main

import (
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	. "github.com/orbs-network/orbs-contract-sdk/go/testing/unit"
	"github.com/stretchr/testify/require"
	"math/big"
	"testing"
)

func TestOrbsVotingContract_mirrorDelegationData(t *testing.T) {
	delegatorAddr := [20]byte{0x01}
	agentAddr := [20]byte{0x02}
	eventName := "Txt"
	eventBlockHeight := uint64(100)
	eventBlockTxIndex := uint64(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// call
		_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockHeight, eventBlockTxIndex, eventName)

		// assert
		require.EqualValues(t, agentAddr[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr)))
		require.EqualValues(t, 100, state.ReadUint64(_formatDelegatorBlockHeightKey(delegatorAddr)))
		require.EqualValues(t, 10, state.ReadUint64(_formatDelegatorBlockTxIndexKey(delegatorAddr)))
		require.EqualValues(t, eventName, state.ReadBytes(_formatDelegatorMethod(delegatorAddr)))
	})
}

func TestOrbsVotingContract_mirrorDelegationData_TransferDoesNotReplaceDelegate(t *testing.T) {
	delegatorAddr := [20]byte{0x01}
	agentAddr := [20]byte{0x02}
	eventName := DELEGATION_BY_TRANSFER_NAME
	eventBlockHeight := uint64(100)
	eventBlockTxIndex := uint64(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), DELEGATION_NAME)

		require.Panics(t, func() {
			_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockHeight, eventBlockTxIndex, eventName)
		}, "should panic because newer delegate")
	})
}

func TestOrbsVotingContract_mirrorDelegationData_DelegateReplacesTransfer(t *testing.T) {
	delegatorAddr := [20]byte{0x01}
	agentAddr := [20]byte{0x02}
	eventName := DELEGATION_NAME
	eventBlockHeight := uint64(100)
	eventBlockTxIndex := uint64(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), DELEGATION_BY_TRANSFER_NAME)
		state.WriteUint64(_formatDelegatorBlockHeightKey(delegatorAddr), 105)
		state.WriteUint64(_formatDelegatorBlockTxIndexKey(delegatorAddr), 50)

		// call
		_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockHeight, eventBlockTxIndex, eventName)

		// assert
		require.EqualValues(t, agentAddr[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr)))
		require.EqualValues(t, 100, state.ReadUint64(_formatDelegatorBlockHeightKey(delegatorAddr)))
		require.EqualValues(t, 10, state.ReadUint64(_formatDelegatorBlockTxIndexKey(delegatorAddr)))
		require.EqualValues(t, DELEGATION_NAME, state.ReadBytes(_formatDelegatorMethod(delegatorAddr)))
	})
}

func TestOrbsVotingContract_mirrorDelegationData_AlreadyHaveNewerEventBlockHeight(t *testing.T) {
	delegatorAddr := [20]byte{0x01}
	agentAddr := [20]byte{0x02}
	eventName := "Txt"
	eventBlockHeight := uint64(100)
	eventBlockTxIndex := uint64(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), eventName)
		state.WriteUint64(_formatDelegatorBlockHeightKey(delegatorAddr), 101)

		require.Panics(t, func() {
			_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockHeight, eventBlockTxIndex, eventName)
		}, "should panic because newer block")
	})
}

func TestOrbsVotingContract_mirrorDelegationData_AlreadyHaveNewerEventBlockTxIndex(t *testing.T) {
	delegatorAddr := [20]byte{0x01}
	agentAddr := [20]byte{0x02}
	eventName := "Txt"
	eventBlockHeight := uint64(100)
	eventBlockTxIndex := uint64(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), eventName)
		state.WriteUint64(_formatDelegatorBlockHeightKey(delegatorAddr), 100)
		state.WriteUint64(_formatDelegatorBlockTxIndexKey(delegatorAddr), 50)

		require.Panics(t, func() {
			_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockHeight, eventBlockTxIndex, eventName)
		}, "should panic because newer tx index")
	})
}

func TestOrbsVotingContract_mirrorDelegationData_BlockHeightAfterElection(t *testing.T) {
}

func TestOrbsVotingContract_preMirrorDelegationData_MirrorPeriodEnded(t *testing.T) {
}

func TestOrbsVotingContract_preMirrorDelegationData_EventPeriodTooNew(t *testing.T) {
}

func TestOrbsVotingContract_mirrorDelegation(t *testing.T) {
	txHex := "0xabcd"
	delegatorAddr := [20]byte{0x01}
	agentAddr := [20]byte{0x02}

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, DELEGATION_NAME, func(out interface{}) {
			v := out.(*Delegate)
			v.Delegator = delegatorAddr
			v.Agent = agentAddr
		})

		mirrorDelegation(txHex)

		// assert
		m.VerifyMocks()
		require.EqualValues(t, agentAddr[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr)))
		require.EqualValues(t, 100, state.ReadUint64(_formatDelegatorBlockHeightKey(delegatorAddr)))
		require.EqualValues(t, 10, state.ReadUint64(_formatDelegatorBlockTxIndexKey(delegatorAddr)))
		require.EqualValues(t, DELEGATION_NAME, state.ReadString(_formatDelegatorMethod(delegatorAddr)))
	})
}

func TestOrbsVotingContract_mirrorDelegationByTransfer(t *testing.T) {
	txHex := "0xabcd"
	delegatorAddr := [20]byte{0x01}
	agentAddr := [20]byte{0x02}
	value := big.NewInt(7)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		m.MockEthereumLog(getTokenAddr(), getTokenAbi(), txHex, DELEGATION_BY_TRANSFER_NAME, func(out interface{}) {
			v := out.(*Transfer)
			v.From = delegatorAddr
			v.To = agentAddr
			v.Value = value
		})

		// call
		mirrorDelegationByTransfer(txHex)

		// assert
		m.VerifyMocks()
		// TODO noam type address
		require.EqualValues(t, agentAddr[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr)))
		require.EqualValues(t, 100, state.ReadUint64(_formatDelegatorBlockHeightKey(delegatorAddr)))
		require.EqualValues(t, 10, state.ReadUint64(_formatDelegatorBlockTxIndexKey(delegatorAddr)))
		require.EqualValues(t, DELEGATION_BY_TRANSFER_NAME, state.ReadBytes(_formatDelegatorMethod(delegatorAddr)))
	})
}

func TestOrbsVotingContract_mirrorDelegationByTransfer_WrongValue(t *testing.T) {
	txHex := "0xabcd"
	value := big.NewInt(8)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		m.MockEthereumLog(getTokenAddr(), getTokenAbi(), txHex, DELEGATION_BY_TRANSFER_NAME, func(out interface{}) {
			v := out.(*Transfer)
			v.Value = value
		})

		// call
		require.Panics(t, func() {
			mirrorDelegationByTransfer(txHex)
		}, "should panic because bad transfer value")
	})
}

func TestOrbsVotingContract_mirrorVote(t *testing.T) {
	txHex := "0xabcd"
	activistAddr := [20]byte{0x01}
	candidateAddrs := [][20]byte{{0x02}, {0x03}, {0x04}}
	eventName := "Vote"

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, func(out interface{}) {
			v := out.(*Vote)
			v.Activist = activistAddr
			v.Candidates = candidateAddrs
		})

		mirrorVote(txHex)

		// assert
		m.VerifyMocks()
		candidates := make([]byte, 0, len(candidateAddrs)*20)
		for _, v := range candidateAddrs {
			candidates = append(candidates, v[:]...)
		}

		require.EqualValues(t, candidates, state.ReadBytes(_formatActivistCandidateKey(activistAddr)))
		require.EqualValues(t, 100, state.ReadUint64(_formatActivistBlockHeightKey(activistAddr)))
		require.EqualValues(t, 10, state.ReadUint64(_formatActivistBlockTxIndexKey(activistAddr)))
	})
}

func TestOrbsVotingContract_mirrorVote_AlreadyHaveNewerEventBlockHeight(t *testing.T) {
	txHex := "0xabcd"
	activistAddr := [20]byte{0x01}
	candidateAddrs := [][20]byte{{0x02}, {0x03}, {0x04}}
	eventName := "Vote"

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		state.WriteUint64(_formatActivistBlockHeightKey(activistAddr), 101)
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, func(out interface{}) {
			v := out.(*Vote)
			v.Activist = activistAddr
			v.Candidates = candidateAddrs
		})

		require.Panics(t, func() {
			mirrorVote(txHex)
		}, "should panic because newer block")
	})
}

func TestOrbsVotingContract_mirrorVote_AlreadyHaveNewerEventBlockTxIndex(t *testing.T) {
	txHex := "0xabcd"
	activistAddr := [20]byte{0x01}
	candidateAddrs := [][20]byte{{0x02}, {0x03}, {0x04}}
	eventName := "Vote"

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		state.WriteUint64(_formatActivistBlockHeightKey(activistAddr), 100)
		state.WriteUint64(_formatActivistBlockTxIndexKey(activistAddr), 50)
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, func(out interface{}) {
			v := out.(*Vote)
			v.Activist = activistAddr
			v.Candidates = candidateAddrs
		})

		require.Panics(t, func() {
			mirrorVote(txHex)
		}, "should panic because newer block")
	})
}

func TestOrbsVotingContract_mirrorVote_NotDueDiligent(t *testing.T) {
}

func TestOrbsVotingContract_processVoting(t *testing.T) {
}
