package main

import (
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	. "github.com/orbs-network/orbs-contract-sdk/go/testing/unit"
	"github.com/stretchr/testify/require"
	"math/big"
	"testing"
)

func TestOrbsVotingContract_mirrorDelegationData(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := "Txt"
	eventBlockHeight := uint64(100)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_HEIGHT, 150)

		// call
		_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockHeight, eventBlockTxIndex, eventName)

		// assert
		require.EqualValues(t, agentAddr[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr[:])))
		require.EqualValues(t, eventBlockHeight, state.ReadUint64(_formatDelegatorBlockHeightKey(delegatorAddr)))
		require.EqualValues(t, eventBlockTxIndex, state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr)))
		require.EqualValues(t, eventName, state.ReadBytes(_formatDelegatorMethod(delegatorAddr)))
	})
}

func TestOrbsVotingContract_mirrorDelegationData_TransferDoesNotReplaceDelegate(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := DELEGATION_BY_TRANSFER_NAME
	eventBlockHeight := uint64(100)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_HEIGHT, 150)

		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), DELEGATION_NAME)

		require.Panics(t, func() {
			_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockHeight, eventBlockTxIndex, eventName)
		}, "should panic because newer delegate")
	})
}

func TestOrbsVotingContract_mirrorDelegationData_DelegateReplacesTransfer(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := DELEGATION_NAME
	eventBlockHeight := uint64(100)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_HEIGHT, 150)

		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), DELEGATION_BY_TRANSFER_NAME)
		state.WriteUint64(_formatDelegatorBlockHeightKey(delegatorAddr), 105)
		state.WriteUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr), 50)

		// call
		_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockHeight, eventBlockTxIndex, eventName)

		// assert
		require.EqualValues(t, agentAddr[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr)))
		require.EqualValues(t, eventBlockHeight, state.ReadUint64(_formatDelegatorBlockHeightKey(delegatorAddr)))
		require.EqualValues(t, eventBlockTxIndex, state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr)))
		require.EqualValues(t, DELEGATION_NAME, state.ReadBytes(_formatDelegatorMethod(delegatorAddr)))
	})
}

func TestOrbsVotingContract_mirrorDelegationData_AlreadyHaveNewerEventBlockHeight(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := "Txt"
	eventBlockHeight := uint64(100)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_HEIGHT, 150)

		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), eventName)
		state.WriteUint64(_formatDelegatorBlockHeightKey(delegatorAddr), 101)

		require.Panics(t, func() {
			_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockHeight, eventBlockTxIndex, eventName)
		}, "should panic because newer block")
	})
}

func TestOrbsVotingContract_mirrorDelegationData_AlreadyHaveNewerEventBlockTxIndex(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := "Txt"
	eventBlockHeight := uint64(100)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_HEIGHT, 150)

		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), eventName)
		state.WriteUint64(_formatDelegatorBlockHeightKey(delegatorAddr), 100)
		state.WriteUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr), 50)

		require.Panics(t, func() {
			_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockHeight, eventBlockTxIndex, eventName)
		}, "should panic because newer tx index")
	})
}

func TestOrbsVotingContract_mirrorDelegationData_EventBlockHeightAfterElection(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := "Txt"
	eventBlockHeight := uint64(200)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_HEIGHT, 150)

		//assert
		require.Panics(t, func() {
			_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockHeight, eventBlockTxIndex, eventName)
		}, "should panic because event is too new")
	})
}

func TestOrbsVotingContract_preMirrorDelegationData_MirrorPeriodEnded(t *testing.T) {
	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		m.MockEthereumGetBlockNumber(5000)

		require.Panics(t, func() {
			_mirrorPeriodValidator()
		}, "should panic because mirror period should have ended")
	})
}

func TestOrbsVotingContract_mirrorDelegation(t *testing.T) {
	txHex := "0xabcd"
	delegatorAddr := [20]byte{0x01}
	agentAddr := [20]byte{0x02}
	blockHeight := 100
	txIndex := 10

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setBasicTiming(m)

		// prepare
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, DELEGATION_NAME, blockHeight, txIndex, func(out interface{}) {
			v := out.(*Delegate)
			v.Stakeholder = delegatorAddr
			v.To = agentAddr
		})

		mirrorDelegation(txHex)

		// assert
		m.VerifyMocks()
		require.EqualValues(t, agentAddr[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr[:])))
		require.EqualValues(t, blockHeight, state.ReadUint64(_formatDelegatorBlockHeightKey(delegatorAddr[:])))
		require.EqualValues(t, txIndex, state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr[:])))
		require.EqualValues(t, DELEGATION_NAME, state.ReadString(_formatDelegatorMethod(delegatorAddr[:])))
	})
}

func TestOrbsVotingContract_mirrorDelegationByTransfer(t *testing.T) {
	txHex := "0xabcd"
	delegatorAddr := [20]byte{0x01}
	agentAddr := [20]byte{0x02}
	value := big.NewInt(7)
	blockHeight := 100
	txIndex := 10

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setBasicTiming(m)

		// prepare
		m.MockEthereumLog(getTokenAddr(), getTokenAbi(), txHex, DELEGATION_BY_TRANSFER_NAME, blockHeight, txIndex, func(out interface{}) {
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
		require.EqualValues(t, agentAddr[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr[:])))
		require.EqualValues(t, blockHeight, state.ReadUint64(_formatDelegatorBlockHeightKey(delegatorAddr[:])))
		require.EqualValues(t, txIndex, state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr[:])))
		require.EqualValues(t, DELEGATION_BY_TRANSFER_NAME, state.ReadBytes(_formatDelegatorMethod(delegatorAddr[:])))
	})
}

func TestOrbsVotingContract_mirrorDelegationByTransfer_WrongValue(t *testing.T) {
	txHex := "0xabcd"
	value := big.NewInt(8)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setBasicTiming(m)

		// prepare
		m.MockEthereumLog(getTokenAddr(), getTokenAbi(), txHex, DELEGATION_BY_TRANSFER_NAME, 100, 10, func(out interface{}) {
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
	blockHeight := 100
	txIndex := 10

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setBasicTiming(m)

		// prepare
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, blockHeight, txIndex, func(out interface{}) {
			v := out.(*Vote)
			v.Voter = activistAddr
			v.Nodeslist = candidateAddrs
		})

		mirrorVote(txHex)

		// assert
		m.VerifyMocks()
		candidates := make([]byte, 0, len(candidateAddrs)*20)
		for _, v := range candidateAddrs {
			candidates = append(candidates, v[:]...)
		}

		require.EqualValues(t, candidates, state.ReadBytes(_formatActivistCandidateKey(activistAddr[:])))
		require.EqualValues(t, blockHeight, state.ReadUint64(_formatActivistBlockHeightKey(activistAddr[:])))
		require.EqualValues(t, txIndex, state.ReadUint32(_formatActivistBlockTxIndexKey(activistAddr[:])))
	})
}

func TestOrbsVotingContract_mirrorVote_AlreadyHaveNewerEventBlockHeight(t *testing.T) {
	txHex := "0xabcd"
	activistAddr := [20]byte{0x01}
	candidateAddrs := [][20]byte{{0x02}, {0x03}, {0x04}}
	eventName := "Vote"

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setBasicTiming(m)

		// prepare
		state.WriteUint64(_formatActivistBlockHeightKey(activistAddr[:]), 101)
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, 100, 10, func(out interface{}) {
			v := out.(*Vote)
			v.Voter = activistAddr
			v.Nodeslist = candidateAddrs
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
		setBasicTiming(m)

		// prepare
		state.WriteUint64(_formatActivistBlockHeightKey(activistAddr[:]), 100)
		state.WriteUint64(_formatActivistBlockTxIndexKey(activistAddr[:]), 50)
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, 100, 10, func(out interface{}) {
			v := out.(*Vote)
			v.Voter = activistAddr
			v.Nodeslist = candidateAddrs
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

func TestOrbsVotingContract_processVoting_MirroringPeriodNotEnded(t *testing.T) {
	t.Skip()
	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setBasicTiming(m)

		// prepare

		require.Panics(t, func() {
			processVoting()
		}, "should panic because mirror not done")
	})
}

func TestOrbsVotingContract_getStakeFromEthereum(t *testing.T) {
	addr := [20]byte{0x01}
	blockHeight := uint64(100)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		m.MockEthereumCallMethodAtBlock(blockHeight, getTokenAddr(), getTokenAbi(), "balanceOf", func(out interface{}) {
			i, ok := out.(**big.Int)
			if ok {
				*i = big.NewInt(64)
			} else {
				panic(fmt.Sprintf("wrong something %s", out))
			}
		}, addr)

		// call
		stake := _getDelegatorStake(addr[:], blockHeight)

		// assert
		m.VerifyMocks()
		require.EqualValues(t, 64, stake)
	})
}

// helpers
func setBasicTiming(m Mockery) {
	setTiming(m, 150, 200)
}
func setTiming(m Mockery, electionBlock uint64, currentBlock int) {
	m.MockEthereumGetBlockNumber(currentBlock)
	state.WriteUint64(ELECTION_BLOCK_HEIGHT, electionBlock)

}
