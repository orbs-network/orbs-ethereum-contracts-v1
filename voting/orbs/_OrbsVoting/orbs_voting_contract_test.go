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
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

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
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

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
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

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
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

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
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

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
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

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
		setTimingInMirror(m)

		// prepare
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, DELEGATION_NAME, blockHeight, txIndex, func(out interface{}) {
			v := out.(*Delegate)
			v.Delegator = delegatorAddr
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
		setTimingInMirror(m)

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
		setTimingInMirror(m)

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
		setTimingInMirror(m)

		// prepare
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, blockHeight, txIndex, func(out interface{}) {
			v := out.(*Vote)
			v.Voter = activistAddr
			v.Nodes_list = candidateAddrs
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
		setTimingInMirror(m)

		// prepare
		state.WriteUint64(_formatActivistBlockHeightKey(activistAddr[:]), 101)
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, 100, 10, func(out interface{}) {
			v := out.(*Vote)
			v.Voter = activistAddr
			v.Nodes_list = candidateAddrs
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
		setTimingInMirror(m)

		// prepare
		state.WriteUint64(_formatActivistBlockHeightKey(activistAddr[:]), 100)
		state.WriteUint64(_formatActivistBlockTxIndexKey(activistAddr[:]), 50)
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, 100, 10, func(out interface{}) {
			v := out.(*Vote)
			v.Voter = activistAddr
			v.Nodes_list = candidateAddrs
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
	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		require.Panics(t, func() {
			processVoting()
		}, "should panic because mirror not done")
	})
}

func TestOrbsVotingContract_getStakeFromEthereum(t *testing.T) {
	addr := [20]byte{0x01}
	blockHeight := uint64(100)
	stakeSetup := 64

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		mockStakeInEthereum(m, blockHeight, addr, stakeSetup)

		// call
		stake := _getDelegatorStake(addr[:], blockHeight)

		// assert
		m.VerifyMocks()
		require.EqualValues(t, stakeSetup, stake)
	})
}

/****
 * process
 */

func TestOrbsVotingContract_processVote_CalulateStakes(t *testing.T) {
	electionBlock := uint64(60000)
	blockNumber := electionBlock + VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS + 2

	validatorAddresses := [][20]byte{{0x01}, {0x02}, {0x03}, {0x04}, {0x05}, {0x06}, {0x07}, {0x08}, {0x09}}
	guardianAddresses := [][20]byte{{0xa0}, {0xa1}, {0xa2}, {0xa3}, {0xa4}}
	guardianVoteBlock := []uint64{electionBlock - 1, electionBlock - 1, electionBlock - 1, electionBlock - 1, electionBlock - 2*VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS - 2}
	guardianVote := [][][20]byte{
		{validatorAddresses[1], validatorAddresses[0], validatorAddresses[2], validatorAddresses[6], validatorAddresses[5]},
		{validatorAddresses[1], validatorAddresses[0], validatorAddresses[2], validatorAddresses[6], validatorAddresses[5]},
		{validatorAddresses[1], validatorAddresses[0], validatorAddresses[2], validatorAddresses[3], validatorAddresses[7]},
		{validatorAddresses[1], validatorAddresses[0], validatorAddresses[2], validatorAddresses[4], validatorAddresses[8]},
		{validatorAddresses[8]},
	}
	guardianStakes := []int{100, 200, 400, 1000, 10000000}
	delegatorAddresses := [][20]byte{{0xb0}, {0xb1}, {0xb2}, {0xb3}, {0xb4}, {0xb5}, {0xb6}, {0xb7}, {0xb8}, {0xb9}, {0xba}, {0xbb}}
	delegatorStakes := []int{500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500}
	delegatorGuardians := [][20]byte{{0xb1}, {0xb2}, {0xa3}, {0xa2}, {0xa2}, {0xa2}, {0xa2}, {0xa2}, {0xa2}, {0xa2}, {0xa2}, {0xa2}}

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setFirstElectionBlockHeight(electionBlock)

		// prepare
		mockValidatorsInEthereum(m, blockNumber, validatorAddresses)
		mockStakesInEthereum(m, blockNumber, guardianAddresses, guardianStakes)
		mockStakesInEthereum(m, blockNumber, delegatorAddresses, delegatorStakes)
		mockDelegationsInOrbs(delegatorAddresses, delegatorGuardians)
		mockGuardianVotesInOrbs(guardianAddresses, guardianVote, guardianVoteBlock)

		// call
		elected := processVotingInternal(blockNumber)
		i := 0
		maxNumberOfProcess := len(guardianAddresses) + len(delegatorAddresses) + 2
		for i := 0; i < maxNumberOfProcess && elected == nil; i++ {
			elected = processVotingInternal(blockNumber)
		}

		// assert
		m.VerifyMocks()
		require.True(t, i <= maxNumberOfProcess, "did not finish in correct amount of passes")
		require.EqualValues(t, "", _getVotingProcessState())
		require.ElementsMatch(t, [][20]byte{validatorAddresses[0], validatorAddresses[1], validatorAddresses[2], validatorAddresses[3], validatorAddresses[7]}, elected)
	})
}

func mockGuardianVotesInOrbs(guardians [][20]byte, votes [][][20]byte, votesBlock []uint64) {
	_setNumberOfGurdians(len(guardians))
	for i := range guardians {
		_setCandidates(guardians[i][:], votes[i])
		state.WriteBytes(_formatGuardianIterator(i), guardians[i][:])
		state.WriteUint64(_formatActivistBlockHeightKey(guardians[i][:]), votesBlock[i])
	}
}

func mockDelegationsInOrbs(delegators [][20]byte, guardians [][20]byte) {
	_setNumberOfDelegators(len(delegators))
	for i := range delegators {
		state.WriteBytes(_formatDelegatorAgentKey(delegators[i][:]), guardians[i][:])
		state.WriteBytes(_formatDelegatorIterator(i), delegators[i][:])
	}
}

func mockStakesInEthereum(m Mockery, blockNumber uint64, guardians [][20]byte, stakes []int) {
	for i := range guardians {
		mockStakeInEthereum(m, blockNumber, guardians[i], stakes[i])
	}
}

// helpers
func mockValidatorsInEthereum(m Mockery, blockNumber uint64, addresses [][20]byte) {
	m.MockEthereumCallMethodAtBlock(blockNumber, getValidatorsAddr(), getValidatorsAbi(), "getValidators", func(out interface{}) {
		ethAddresses, ok := out.(*[][20]byte)
		if ok {
			*ethAddresses = addresses
		} else {
			panic(fmt.Sprintf("wrong type %s", out))
		}
	})
}

func mockStakeInEthereum(m Mockery, blockHeight uint64, address [20]byte, stake int) {
	//var ethAddress [20]byte
	//copy(ethAddress[:], address)

	m.MockEthereumCallMethodAtBlock(blockHeight, getTokenAddr(), getTokenAbi(), "balanceOf", func(out interface{}) {
		i, ok := out.(**big.Int)
		if ok {
			*i = big.NewInt(int64(stake))
		} else {
			panic(fmt.Sprintf("wrong something %s", out))
		}
	}, address)
}

func setTimingInMirror(m Mockery) {
	election := uint64(150)
	setTiming(m, election, int(election+VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS)-2)
}
func setTiming(m Mockery, electionBlock uint64, currentBlock int) {
	m.MockEthereumGetBlockNumber(currentBlock)
	state.WriteUint64(ELECTION_BLOCK_NUMBER, electionBlock)

}
