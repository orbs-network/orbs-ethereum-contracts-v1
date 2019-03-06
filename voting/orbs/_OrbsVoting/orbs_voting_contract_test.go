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
	eventBlockNumber := uint64(100)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

		// call
		_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockNumber, eventBlockTxIndex, eventName)

		// assert
		require.EqualValues(t, agentAddr[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr[:])))
		require.EqualValues(t, eventBlockNumber, state.ReadUint64(_formatDelegatorBlockNumberKey(delegatorAddr)))
		require.EqualValues(t, eventBlockTxIndex, state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr)))
		require.EqualValues(t, eventName, state.ReadBytes(_formatDelegatorMethod(delegatorAddr)))
	})
}

func TestOrbsVotingContract_mirrorDelegationData_TransferDoesNotReplaceDelegate(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := DELEGATION_BY_TRANSFER_NAME
	eventBlockNumber := uint64(100)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), DELEGATION_NAME)

		require.Panics(t, func() {
			_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockNumber, eventBlockTxIndex, eventName)
		}, "should panic because newer delegate")
	})
}

func TestOrbsVotingContract_mirrorDelegationData_DelegateReplacesTransfer(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := DELEGATION_NAME
	eventBlockNumber := uint64(100)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), DELEGATION_BY_TRANSFER_NAME)
		state.WriteUint64(_formatDelegatorBlockNumberKey(delegatorAddr), 105)
		state.WriteUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr), 50)

		// call
		_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockNumber, eventBlockTxIndex, eventName)

		// assert
		require.EqualValues(t, agentAddr[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr)))
		require.EqualValues(t, eventBlockNumber, state.ReadUint64(_formatDelegatorBlockNumberKey(delegatorAddr)))
		require.EqualValues(t, eventBlockTxIndex, state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr)))
		require.EqualValues(t, DELEGATION_NAME, state.ReadBytes(_formatDelegatorMethod(delegatorAddr)))
	})
}

func TestOrbsVotingContract_mirrorDelegationData_AlreadyHaveNewerEventBlockNumber(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := "Txt"
	eventBlockNumber := uint64(100)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), eventName)
		state.WriteUint64(_formatDelegatorBlockNumberKey(delegatorAddr), 101)

		require.Panics(t, func() {
			_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockNumber, eventBlockTxIndex, eventName)
		}, "should panic because newer block")
	})
}

func TestOrbsVotingContract_mirrorDelegationData_AlreadyHaveNewerEventBlockTxIndex(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := "Txt"
	eventBlockNumber := uint64(100)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

		// prepare
		state.WriteString(_formatDelegatorMethod(delegatorAddr), eventName)
		state.WriteUint64(_formatDelegatorBlockNumberKey(delegatorAddr), 100)
		state.WriteUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr), 50)

		require.Panics(t, func() {
			_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockNumber, eventBlockTxIndex, eventName)
		}, "should panic because newer tx index")
	})
}

func TestOrbsVotingContract_mirrorDelegationData_EventBlockNumberAfterElection(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := "Txt"
	eventBlockNumber := uint64(200)
	eventBlockTxIndex := uint32(10)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		state.WriteUint64(ELECTION_BLOCK_NUMBER, 150)

		//assert
		require.Panics(t, func() {
			_mirrorDelegationData(delegatorAddr, agentAddr, eventBlockNumber, eventBlockTxIndex, eventName)
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
	BlockNumber := 100
	txIndex := 10

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		// prepare
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, DELEGATION_NAME, BlockNumber, txIndex, func(out interface{}) {
			v := out.(*Delegate)
			v.Delegator = delegatorAddr
			v.To = agentAddr
		})

		mirrorDelegation(txHex)

		// assert
		m.VerifyMocks()
		require.EqualValues(t, agentAddr[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr[:])))
		require.EqualValues(t, BlockNumber, state.ReadUint64(_formatDelegatorBlockNumberKey(delegatorAddr[:])))
		require.EqualValues(t, txIndex, state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr[:])))
		require.EqualValues(t, DELEGATION_NAME, state.ReadString(_formatDelegatorMethod(delegatorAddr[:])))
	})
}

func TestOrbsVotingContract_mirrorDelegationByTransfer(t *testing.T) {
	txHex := "0xabcd"
	delegatorAddr := [20]byte{0x01}
	agentAddr := [20]byte{0x02}
	value := big.NewInt(7)
	BlockNumber := 100
	txIndex := 10

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		// prepare
		m.MockEthereumLog(getTokenAddr(), getTokenAbi(), txHex, DELEGATION_BY_TRANSFER_NAME, BlockNumber, txIndex, func(out interface{}) {
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
		require.EqualValues(t, BlockNumber, state.ReadUint64(_formatDelegatorBlockNumberKey(delegatorAddr[:])))
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
	BlockNumber := 100
	txIndex := 10

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		// prepare
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, BlockNumber, txIndex, func(out interface{}) {
			v := out.(*Vote)
			v.Voter = activistAddr
			v.Nodes = candidateAddrs
		})

		mirrorVote(txHex)

		// assert
		m.VerifyMocks()
		candidates := make([]byte, 0, len(candidateAddrs)*20)
		for _, v := range candidateAddrs {
			candidates = append(candidates, v[:]...)
		}

		require.EqualValues(t, candidates, state.ReadBytes(_formatGuardianCandidateKey(activistAddr[:])))
		require.EqualValues(t, BlockNumber, state.ReadUint64(_formatGuardianBlockNumberKey(activistAddr[:])))
		require.EqualValues(t, txIndex, state.ReadUint32(_formatGuardianBlockTxIndexKey(activistAddr[:])))
	})
}

func TestOrbsVotingContract_mirrorVote_AlreadyHaveNewerEventBlockNumber(t *testing.T) {
	txHex := "0xabcd"
	activistAddr := [20]byte{0x01}
	candidateAddrs := [][20]byte{{0x02}, {0x03}, {0x04}}
	eventName := "Vote"

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		// prepare
		state.WriteUint64(_formatGuardianBlockNumberKey(activistAddr[:]), 101)
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, 100, 10, func(out interface{}) {
			v := out.(*Vote)
			v.Voter = activistAddr
			v.Nodes = candidateAddrs
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
		state.WriteUint64(_formatGuardianBlockNumberKey(activistAddr[:]), 100)
		state.WriteUint64(_formatGuardianBlockTxIndexKey(activistAddr[:]), 50)
		m.MockEthereumLog(getVotingAddr(), getVotingAbi(), txHex, eventName, 100, 10, func(out interface{}) {
			v := out.(*Vote)
			v.Voter = activistAddr
			v.Nodes = candidateAddrs
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
	blockNumber := uint64(100)
	stakeSetup := 64

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		_setElectionBlockNumber(blockNumber)
		mockStakeInEthereum(m, blockNumber, addr, stakeSetup)

		// call
		stake := _getDelegatorStakeAtElection(addr)

		// assert
		m.VerifyMocks()
		require.EqualValues(t, stakeSetup, stake)
	})
}

/****
 * process
 */

type harness struct {
	electionBlock      uint64
	blockNumber        uint64
	validatorAddresses [][20]byte

	nextGuardianAddress  byte
	nextDelegatorAddress byte
	nextValidatorAddress byte

	guardians  []*guardian
	delegators []*delegator
}

type actor struct {
	stake   int
	address [20]byte
}

type guardian struct {
	actor
	voteBlock       uint64
	votedValidators [][20]byte
}

type delegator struct {
	actor
	delegate [20]byte
}

func (g *guardian) vote(asOfBlock uint64, validators ...[20]byte) {
	g.voteBlock = asOfBlock
	g.votedValidators = validators
}

func (f *harness) setupEthereumState(m Mockery) {
	mockValidatorsInEthereum(m, f.electionBlock, f.validatorAddresses)

	for _, a := range f.guardians {
		if a.voteBlock > f.electionBlock-VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS {
			mockStakeInEthereum(m, f.electionBlock, a.address, a.stake)
		}
	}

	for _, d := range f.delegators {
		mockStakeInEthereum(m, f.electionBlock, d.address, d.stake)
	}

}

func (f *harness) setupOrbsState() {
	setFirstElectionBlockNumber(f.electionBlock)
	f.mockDelegationsInOrbs()
	f.mockGuardianVotesInOrbs()
}

func newHarness() *harness {
	return &harness{nextGuardianAddress: 0xa0, nextDelegatorAddress: 0xb0, nextValidatorAddress: 0x01}
}

func (f *harness) addGuardian(stake int) *guardian {
	g := &guardian{actor: actor{stake: stake, address: [20]byte{f.nextGuardianAddress}}}
	f.nextGuardianAddress++
	f.guardians = append(f.guardians, g)
	return g
}

func (f *harness) addDelegator(stake int, delegate [20]byte) *delegator {
	d := &delegator{actor: actor{stake: stake, address: [20]byte{f.nextDelegatorAddress}}, delegate: delegate}
	f.nextDelegatorAddress++
	f.delegators = append(f.delegators, d)
	return d
}

func (f *harness) mockGuardianVotesInOrbs() {
	_setNumberOfGurdians(len(f.guardians))
	for i, guardian := range f.guardians {
		_setCandidates(guardian.address[:], guardian.votedValidators)
		state.WriteUint64(_formatGuardianBlockNumberKey(guardian.address[:]), guardian.voteBlock)
		state.WriteBytes(_formatGuardianIterator(i), guardian.address[:])
	}
}

func (f *harness) mockDelegationsInOrbs() {
	_setNumberOfDelegators(len(f.delegators))
	for i, d := range f.delegators {
		state.WriteBytes(_formatDelegatorAgentKey(d.address[:]), d.delegate[:])
		state.WriteBytes(_formatDelegatorIterator(i), d.address[:])
	}
}

func (f *harness) addValidator() [20]byte {
	validator := [20]byte{f.nextValidatorAddress}
	f.validatorAddresses = append(f.validatorAddresses, validator)
	f.nextValidatorAddress++
	return validator
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

func mockStakeInEthereum(m Mockery, BlockNumber uint64, address [20]byte, stake int) {
	m.MockEthereumCallMethodAtBlock(BlockNumber, getTokenAddr(), getTokenAbi(), "balanceOf", func(out interface{}) {
		i, ok := out.(**big.Int)
		if ok {
			*i = big.NewInt(int64(stake))
		} else {
			panic(fmt.Sprintf("wrong something %s", out))
		}
	}, address)
}

func TestOrbsVotingContract_processVote_CalulateStakes(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)
	h.blockNumber = h.electionBlock + VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS + 2
	aRecentVoteBlock := h.electionBlock - 1
	anAncientVoteBlock := h.electionBlock - 2*VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS - 2

	var v1, v2, v3, v4, v5, v6, v7, v8, v9 = h.addValidator(), h.addValidator(), h.addValidator(), h.addValidator(), h.addValidator(), h.addValidator(), h.addValidator(), h.addValidator(), h.addValidator()
	var g1, g2, g3, g4, g5 = h.addGuardian(100), h.addGuardian(200), h.addGuardian(400), h.addGuardian(1000), h.addGuardian(10000000)

	g1.vote(aRecentVoteBlock, v2, v1, v3, v7, v6)
	g2.vote(aRecentVoteBlock, v2, v1, v3, v7, v6)
	g3.vote(aRecentVoteBlock, v2, v1, v3, v4, v8)
	g4.vote(aRecentVoteBlock, v2, v1, v3, v5, v9)
	g5.vote(anAncientVoteBlock, v9)

	for i := 0; i < 10; i++ {
		h.addDelegator(500, g3.address)
	}

	d1 := h.addDelegator(500, g4.address)
	d2 := h.addDelegator(500, d1.address)
	h.addDelegator(500, d2.address)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		h.setupEthereumState(m)
		h.setupOrbsState()

		// call
		elected := _processVotingStateMachine()
		i := 0
		expectedNumOfStateTransitions := len(h.guardians) + len(h.delegators) + 2
		for i := 0; i < expectedNumOfStateTransitions && elected == nil; i++ {
			elected = _processVotingStateMachine()
		}

		// assert
		m.VerifyMocks()
		require.True(t, i <= expectedNumOfStateTransitions, "did not finish in correct amount of passes")
		require.EqualValues(t, "", _getVotingProcessState())
		require.ElementsMatch(t, [][20]byte{v1, v2, v3, v4, v8}, elected)
	})
}

func TestOrbsVotingContract_processVote_collectOneGuardianStakeFromEthereum_NoStateAddr_DoesntFail(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// call
		_collectOneGuardianStakeFromEthereum(0)

		// assert
		m.VerifyMocks()
	})
}

func TestOrbsVotingContract_processVote_collectGuardiansStakeFromEthereum_GuardiansWithAncientVoteIgnored(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)
	aRecentVoteBlock := h.electionBlock - 1
	anAncientVoteBlock := h.electionBlock - 2*VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS - 2

	var v1 = h.addValidator()
	var g1, g2, g3, g4 = h.addGuardian(100), h.addGuardian(200), h.addGuardian(100), h.addGuardian(100)

	g1.vote(aRecentVoteBlock, v1)
	g2.vote(aRecentVoteBlock, v1)
	g3.vote(anAncientVoteBlock, v1)
	g4.vote(0, v1) // fake didn't vote

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		h.setupOrbsState()
		fmt.Printf("noam : user %x , stake %d \n", g1.address, 400)

		mockStakeInEthereum(m, h.electionBlock, g1.address, 400)
		mockStakeInEthereum(m, h.electionBlock, g2.address, 600)
		_setVotingProcessItem(0)

		// call
		i := 0
		for ; i < 4; i++ {
			_collectNextGuardianStakeFromEthereum()
		}

		// assert
		m.VerifyMocks()
		require.EqualValues(t, VOTING_PROCESS_STATE_DELEGATORS, _getVotingProcessState())
		require.EqualValues(t, 0, _getVotingProcessItem())
		require.EqualValues(t, 400, state.ReadUint64(_formatGuardianStakeKey(g1.address[:])))
		require.EqualValues(t, 600, state.ReadUint64(_formatGuardianStakeKey(g2.address[:])))
		require.EqualValues(t, 0, state.ReadUint64(_formatGuardianStakeKey(g3.address[:])))
		require.EqualValues(t, 0, state.ReadUint64(_formatGuardianStakeKey(g4.address[:])))
	})
}

func TestOrbsVotingContract_processVote_collectOneDelegatorStakeFromEthereum_NoStateAddr_DoesntFail(t *testing.T) {
	electionBlock := uint64(60000)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		_setElectionBlockNumber(electionBlock)
		mockStakeInEthereum(m, electionBlock, [20]byte{}, 0)

		// call
		_collectOneDelegatorStakeFromEthereum(0)

		// assert
		m.VerifyMocks()
	})
}

func TestOrbsVotingContract_processVote_collectGuardiansStake_NoState(t *testing.T) {
	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// call
		guardianStakes := _collectGuardiansStake()

		// assert
		m.VerifyMocks()
		require.Len(t, guardianStakes, 0, "should stay empty")
	})
}

func TestOrbsVotingContract_processVote_collectGuardiansStake_OnlyNumOfGuardiansInState(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)
	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		h.setupOrbsState()
		_setNumberOfGurdians(10)

		// call
		guardianStakes := _collectGuardiansStake()

		// assert
		m.VerifyMocks()
		require.Len(t, guardianStakes, 0, "should stay empty")
	})
}

func TestOrbsVotingContract_processVote_collectGuardiansStake_GuardiansWithAncientVoteIgnored(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)
	aRecentVoteBlock := h.electionBlock - 1
	anAncientVoteBlock := h.electionBlock - 2*VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS - 2

	var v1 = h.addValidator()
	var g1, g2, g3, g4 = h.addGuardian(100), h.addGuardian(200), h.addGuardian(100), h.addGuardian(100)

	g1.vote(aRecentVoteBlock, v1)
	g2.vote(aRecentVoteBlock, v1)
	g3.vote(anAncientVoteBlock, v1)
	g4.vote(0, v1) // fake didn't vote

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		h.setupOrbsState()

		// call
		guardianStakes := _collectGuardiansStake()

		// assert
		m.VerifyMocks()
		require.Len(t, guardianStakes, 2)
		_, ok := guardianStakes[g3.address]
		require.False(t, ok, "g3 should not exist ")
		_, ok = guardianStakes[g4.address]
		require.False(t, ok, "g4 should not exist ")
	})
}

func TestOrbsVotingContract_processVote_collectDelegatorStake_DelegatorIgnoredIfIsGuardian(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)
	aRecentVoteBlock := h.electionBlock - 1

	var g1 = h.addGuardian(100)

	g1.vote(aRecentVoteBlock, h.addValidator())

	h.addDelegator(500, g1.address)
	d2 := h.addDelegator(500, g1.address)
	h.addDelegator(500, g1.address)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		h.setupOrbsState()

		// call
		guardianStakes := make(map[[20]byte]uint64)
		guardianStakes[d2.address] = 50
		delegatorStakes := _collectDelegatorsStake(guardianStakes)

		// assert
		m.VerifyMocks()
		require.Len(t, delegatorStakes, 2)
		_, ok := delegatorStakes[d2.address]
		require.False(t, ok, "d2 should not exist as delegator")
	})
}

func TestOrbsVotingContract_processVote_findGuardianDelegators_IgnoreSelfDelegation(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)
	h.addDelegator(500, [20]byte{})
	h.delegators[0].delegate = h.delegators[0].address

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		h.setupOrbsState()

		// call
		guardianStakes := make(map[[20]byte]uint64)
		delegatorStakes := _collectDelegatorsStake(guardianStakes)
		guardianDelegators := _findGuardianDelegators(delegatorStakes)

		// assert
		m.VerifyMocks()
		require.Len(t, guardianDelegators, 0)
	})
}

func TestOrbsVotingContract_processVote_calculateOneGuardianVoteRecursive(t *testing.T) {
	guardian := [20]byte{0xa0}
	delegatorStakes := map[[20]byte]uint64{
		{0xb0}: 100,
		{0xb1}: 200,
		{0xb2}: 300,
		{0xb3}: 400,
	}
	tests := []struct {
		name         string
		expect       uint64
		relationship map[[20]byte][][20]byte
	}{
		{"simple one delegate", 200, map[[20]byte][][20]byte{{0xa0}: {{0xb1}}}},
		{"simple two delegates", 600, map[[20]byte][][20]byte{{0xa0}: {{0xb1}, {0xb3}}}},
		{"simple all delegates", 1000, map[[20]byte][][20]byte{{0xa0}: {{0xb1}, {0xb0}, {0xb2}, {0xb3}}}},
		{"level one has another delegate", 500, map[[20]byte][][20]byte{{0xa0}: {{0xb1}}, {0xb1}: {{0xb2}}}},
		{"simple and level one has another delegate", 600, map[[20]byte][][20]byte{{0xa0}: {{0xb0}, {0xb1}}, {0xb1}: {{0xb2}}}},
		{"level one has another two delegate", 900, map[[20]byte][][20]byte{{0xa0}: {{0xb1}}, {0xb1}: {{0xb2}, {0xb3}}}},
		{"level two has level one has another two delegate", 1000, map[[20]byte][][20]byte{{0xa0}: {{0xb0}}, {0xb0}: {{0xb1}}, {0xb1}: {{0xb2}, {0xb3}}}},
	}
	for i := range tests {
		cTest := tests[i] // this is so that we can run tests in parallel, see https://gist.github.com/posener/92a55c4cd441fc5e5e85f27bca008721
		t.Run(cTest.name, func(t *testing.T) {
			t.Parallel()
			stakes := _calculateOneGuardianVoteRecursive(guardian, cTest.relationship, delegatorStakes)
			require.EqualValues(t, cTest.expect, stakes, fmt.Sprintf("%s was calculated to %d instead of %d", cTest.name, stakes, cTest.expect))
		})
	}
}

func TestOrbsVotingContract_processVote_guardiansCastVotes(t *testing.T) {
	a0, a1, a2 := [20]byte{0xa0}, [20]byte{0xa1}, [20]byte{0xa2}
	delegatorStakes := map[[20]byte]uint64{
		{0xa0, 0xb0}: 100, {0xa0, 0xb1}: 200,
		{0xa1, 0xb0}: 100, {0xa1, 0xb1}: 200, {0xa1, 0xb2}: 300,
		{0xa2, 0xb0}: 100, {0xa2, 0xb1}: 200, {0xa2, 0xb2}: 300, {0xa2, 0xb3}: 400,
	}
	relationship := map[[20]byte][][20]byte{
		a0: {{0xa0, 0xb0}, {0xa0, 0xb1}},                               // 300
		a1: {{0xa1, 0xb0}, {0xa1, 0xb1}}, {0xa1, 0xb1}: {{0xa1, 0xb2}}, // 600
		a2: {{0xa2, 0xb0}}, {0xa2, 0xb0}: {{0xa2, 0xb1}}, {0xa2, 0xb1}: {{0xa2, 0xb2}, {0xa2, 0xb3}}, // 1000
	}
	v1, v2, v3, v4, v5 := [20]byte{0xc1}, [20]byte{0xc2}, [20]byte{0xc3}, [20]byte{0xc4}, [20]byte{0xc5}
	a0Vote := [][20]byte{v1, v2}
	a1Vote := [][20]byte{v3, v4, v5}
	a2Vote := [][20]byte{v1, v3, v5}

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		_setCandidates(a0[:], a0Vote)
		_setCandidates(a1[:], a1Vote)
		_setCandidates(a2[:], a2Vote)
		tests := []struct {
			name          string
			expect        map[[20]byte]uint64
			guardianStake map[[20]byte]uint64
		}{
			{"simple one guardian", map[[20]byte]uint64{v1: 320, v2: 320}, map[[20]byte]uint64{a0: 20}},
			{"simple two guardian", map[[20]byte]uint64{v1: 320, v2: 320, v3: 700, v4: 700, v5: 700}, map[[20]byte]uint64{a0: 20, a1: 100}},
			{"simple three guardian", map[[20]byte]uint64{v1: 1330, v2: 320, v3: 1710, v4: 700, v5: 1710}, map[[20]byte]uint64{a0: 20, a1: 100, a2: 10}},
		}
		for i := range tests {
			cTest := tests[i] // this is so that we can run tests in parallel, see https://gist.github.com/posener/92a55c4cd441fc5e5e85f27bca008721
			candidatesVotes := _guardiansCastVotes(cTest.guardianStake, relationship, delegatorStakes)
			for validator, vote := range cTest.expect {
				require.EqualValues(t, vote, candidatesVotes[validator])
			}
		}
	})
}

func TestOrbsVotingContract_processVote_guardiansCastVotes_VotesPerToken(t *testing.T) {
	a0 := [20]byte{0xa0}
	guardianStakes := map[[20]byte]uint64{a0: 100}
	delegatorStakes := map[[20]byte]uint64{
		{0xa0, 0xb0}: 100, {0xa0, 0xb1}: 200, {0xa0, 0xb2}: 300, {0xa0, 0xb3}: 400,
	}
	relationship := map[[20]byte][][20]byte{
		a0: {{0xa0, 0xb0}}, {0xa0, 0xb0}: {{0xa0, 0xb1}}, {0xa0, 0xb1}: {{0xa0, 0xb2}, {0xa0, 0xb3}}, // 1000
	}
	v1, v2, v3, v4, v5, v6 := [20]byte{0xc1}, [20]byte{0xc2}, [20]byte{0xc3}, [20]byte{0xc4}, [20]byte{0xc5}, [20]byte{0xc6}
	a0Vote := [][20]byte{v1, v2, v3, v4, v5, v6}

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		_setCandidates(a0[:], a0Vote)
		candidatesVotes := _guardiansCastVotes(guardianStakes, relationship, delegatorStakes)
		for _, vote := range candidatesVotes {
			require.EqualValues(t, 1100, vote)
		}
	})
}

/***
 * helpers
 */
func setTimingInMirror(m Mockery) {
	election := uint64(150)
	setTiming(m, election, int(election+VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS)-2)
}
func setTiming(m Mockery, electionBlock uint64, currentBlock int) {
	m.MockEthereumGetBlockNumber(currentBlock)
	state.WriteUint64(ELECTION_BLOCK_NUMBER, electionBlock)

}
