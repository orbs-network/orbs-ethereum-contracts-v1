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
		_setCurrentElectionBlockNumber(150)

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
		_setCurrentElectionBlockNumber(150)

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
		_setCurrentElectionBlockNumber(150)

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

func TestOrbsVotingContract_mirrorDelegationData_DelegateReset(t *testing.T) {
	delegatorAddr := []byte{0x01}
	agentAddr := []byte{0x02}
	eventName := DELEGATION_NAME
	eventBlockNumber := uint64(100)
	eventBlockTxIndex := uint32(10)
	emptyAddre := [20]byte{}

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		_setCurrentElectionBlockNumber(150)

		// prepare
		state.WriteBytes(_formatDelegatorAgentKey(delegatorAddr), agentAddr)
		state.WriteString(_formatDelegatorMethod(delegatorAddr), DELEGATION_NAME)
		state.WriteUint64(_formatDelegatorBlockNumberKey(delegatorAddr), 95)
		state.WriteUint32(_formatDelegatorBlockTxIndexKey(delegatorAddr), 1)

		// call
		_mirrorDelegationData(delegatorAddr, delegatorAddr, eventBlockNumber, eventBlockTxIndex, eventName)

		// assert
		require.EqualValues(t, emptyAddre[:], state.ReadBytes(_formatDelegatorAgentKey(delegatorAddr)))
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
		_setCurrentElectionBlockNumber(150)

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
		_setCurrentElectionBlockNumber(150)

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
		_setCurrentElectionBlockNumber(150)

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
		_setCurrentElectionBlockNumber(150)
		_setVotingProcessState("x")
		m.MockEthereumGetBlockNumber(5000)

		require.Panics(t, func() {
			_mirrorPeriodValidator()
		}, "should panic because mirror period should have ended")
	})
}

func TestOrbsVotingContract_preMirrorDelegationData_MirrorPeriodNotEndIfNotProcessStart(t *testing.T) {
	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		// prepare
		_setCurrentElectionBlockNumber(150)
		m.MockEthereumGetBlockNumber(5000)

		_mirrorPeriodValidator()
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
		m.MockEthereumLog(getVotingEthereumContractAddress(), getVotingAbi(), txHex, DELEGATION_NAME, BlockNumber, txIndex, func(out interface{}) {
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
		m.MockEthereumLog(getTokenEthereumContractAddress(), getTokenAbi(), txHex, DELEGATION_BY_TRANSFER_NAME, BlockNumber, txIndex, func(out interface{}) {
			v := out.(*Transfer)
			v.From = delegatorAddr
			v.To = agentAddr
			v.Value = value
		})

		// call
		mirrorDelegationByTransfer(txHex)

		// assert
		m.VerifyMocks()
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
		m.MockEthereumLog(getTokenEthereumContractAddress(), getTokenAbi(), txHex, DELEGATION_BY_TRANSFER_NAME, 100, 10, func(out interface{}) {
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
	guardianAddr := [20]byte{0x01}
	candidateAddrs := [][20]byte{{0x02}, {0x03}, {0x04}}
	blockNumber := 100
	txIndex := 10

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		// prepare
		m.MockEthereumLog(getVotingEthereumContractAddress(), getVotingAbi(), txHex, VOTE_OUT_NAME, blockNumber, txIndex, func(out interface{}) {
			v := out.(*VoteOut)
			v.Voter = guardianAddr
			v.Nodes = candidateAddrs
		})
		mockGuardianInEthereum(m, uint64(blockNumber), guardianAddr, true)

		// call
		mirrorVote(txHex)

		// assert
		m.VerifyMocks()
		candidates := make([]byte, 0, len(candidateAddrs)*20)
		for _, v := range candidateAddrs {
			candidates = append(candidates, v[:]...)
		}

		require.EqualValues(t, candidates, state.ReadBytes(_formatGuardianCandidateKey(guardianAddr[:])))
		require.EqualValues(t, blockNumber, state.ReadUint64(_formatGuardianBlockNumberKey(guardianAddr[:])))
		require.EqualValues(t, txIndex, state.ReadUint32(_formatGuardianBlockTxIndexKey(guardianAddr[:])))
	})
}

func TestOrbsVotingContract_mirrorVoteLessThanMaximum(t *testing.T) {
	txHex := "0xabcd"
	guardianAddr := [20]byte{0x01}
	candidateAddrs := [][20]byte{{0x02}, {0x03}}
	blockNumber := 100
	txIndex := 10

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		// prepare
		m.MockEthereumLog(getVotingEthereumContractAddress(), getVotingAbi(), txHex, VOTE_OUT_NAME, blockNumber, txIndex, func(out interface{}) {
			v := out.(*VoteOut)
			v.Voter = guardianAddr
			v.Nodes = candidateAddrs
		})
		mockGuardianInEthereum(m, uint64(blockNumber), guardianAddr, true)

		// call
		mirrorVote(txHex)

		// assert
		m.VerifyMocks()
		candidates := make([]byte, 0, len(candidateAddrs)*20)
		for _, v := range candidateAddrs {
			candidates = append(candidates, v[:]...)
		}

		require.EqualValues(t, candidates, state.ReadBytes(_formatGuardianCandidateKey(guardianAddr[:])))
		require.EqualValues(t, blockNumber, state.ReadUint64(_formatGuardianBlockNumberKey(guardianAddr[:])))
		require.EqualValues(t, txIndex, state.ReadUint32(_formatGuardianBlockTxIndexKey(guardianAddr[:])))
	})
}

func TestOrbsVotingContract_mirrorVote_NotGuardian(t *testing.T) {
	txHex := "0xabcd"
	guardianAddr := [20]byte{0x01}
	candidateAddrs := [][20]byte{{0x02}, {0x03}, {0x04}}
	blockNumber := 100
	txIndex := 10

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		// prepare
		m.MockEthereumLog(getVotingEthereumContractAddress(), getVotingAbi(), txHex, VOTE_OUT_NAME, blockNumber, txIndex, func(out interface{}) {
			v := out.(*VoteOut)
			v.Voter = guardianAddr
			v.Nodes = candidateAddrs
		})
		mockGuardianInEthereum(m, uint64(blockNumber), guardianAddr, false)

		require.Panics(t, func() {
			mirrorVote(txHex)
		}, "should panic because not guardian")
	})
}

func TestOrbsVotingContract_mirrorVote_NoCandidates(t *testing.T) {
	txHex := "0xabcd"
	guardianAddr := [20]byte{0x01}
	candidateAddrs := make([][20]byte, 0)
	blockNumber := 100
	txIndex := 10

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		// prepare
		m.MockEthereumLog(getVotingEthereumContractAddress(), getVotingAbi(), txHex, VOTE_OUT_NAME, blockNumber, txIndex, func(out interface{}) {
			v := out.(*VoteOut)
			v.Voter = guardianAddr
			v.Nodes = candidateAddrs
		})
		mockGuardianInEthereum(m, uint64(blockNumber), guardianAddr, true)

		mirrorVote(txHex)

		// assert
		m.VerifyMocks()
		candidates := make([]byte, 0, len(candidateAddrs)*20)
		for _, v := range candidateAddrs {
			candidates = append(candidates, v[:]...)
		}

		require.EqualValues(t, candidates, state.ReadBytes(_formatGuardianCandidateKey(guardianAddr[:])))
		require.EqualValues(t, blockNumber, state.ReadUint64(_formatGuardianBlockNumberKey(guardianAddr[:])))
		require.EqualValues(t, txIndex, state.ReadUint32(_formatGuardianBlockTxIndexKey(guardianAddr[:])))
	})
}

func TestOrbsVotingContract_mirrorVote_TooManyCandidates(t *testing.T) {
	txHex := "0xabcd"
	guardianAddr := [20]byte{0x01}
	candidateAddrs := [][20]byte{{0x02}, {0x03}, {0x04}, {0x05}}
	blockNumber := 100
	txIndex := 10

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		// prepare
		m.MockEthereumLog(getVotingEthereumContractAddress(), getVotingAbi(), txHex, VOTE_OUT_NAME, blockNumber, txIndex, func(out interface{}) {
			v := out.(*VoteOut)
			v.Voter = guardianAddr
			v.Nodes = candidateAddrs
		})

		require.Panics(t, func() {
			mirrorVote(txHex)
		}, "should panic because too many candidates")
	})
}

func TestOrbsVotingContract_mirrorVote_AlreadyHaveNewerEventBlockNumber(t *testing.T) {
	txHex := "0xabcd"
	guardianAddr := [20]byte{0x01}
	candidateAddrs := [][20]byte{{0x02}, {0x03}, {0x04}}
	blockNumber := 100

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		// prepare
		state.WriteUint64(_formatGuardianBlockNumberKey(guardianAddr[:]), 101)
		m.MockEthereumLog(getVotingEthereumContractAddress(), getVotingAbi(), txHex, VOTE_OUT_NAME, blockNumber, 10, func(out interface{}) {
			v := out.(*VoteOut)
			v.Voter = guardianAddr
			v.Nodes = candidateAddrs
		})
		mockGuardianInEthereum(m, uint64(blockNumber), guardianAddr, true)

		require.Panics(t, func() {
			mirrorVote(txHex)
		}, "should panic because newer block")
	})
}

func TestOrbsVotingContract_mirrorVote_AlreadyHaveNewerEventBlockTxIndex(t *testing.T) {
	txHex := "0xabcd"
	guardianAddr := [20]byte{0x01}
	candidateAddrs := [][20]byte{{0x02}, {0x03}, {0x04}}
	blockNumber := 100

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		setTimingInMirror(m)

		// prepare
		state.WriteUint64(_formatGuardianBlockNumberKey(guardianAddr[:]), uint64(blockNumber))
		state.WriteUint64(_formatGuardianBlockTxIndexKey(guardianAddr[:]), 50)
		m.MockEthereumLog(getVotingEthereumContractAddress(), getVotingAbi(), txHex, VOTE_OUT_NAME, blockNumber, 10, func(out interface{}) {
			v := out.(*VoteOut)
			v.Voter = guardianAddr
			v.Nodes = candidateAddrs
		})
		mockGuardianInEthereum(m, uint64(blockNumber), guardianAddr, true)

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
		_setCurrentElectionBlockNumber(blockNumber)
		mockStakeInEthereum(m, blockNumber, addr, stakeSetup)

		// call
		stake := _getStakeAtElection(addr)

		// assert
		m.VerifyMocks()
		require.EqualValues(t, stakeSetup, stake)
	})
}

/****
 * process
 */

type harness struct {
	electionBlock uint64
	blockNumber   uint64

	nextGuardianAddress      byte
	nextDelegatorAddress     byte
	nextValidatorAddress     byte
	nextValidatorOrbsAddress byte

	guardians  []*guardian
	delegators []*delegator
	validators []*validator
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

type validator struct {
	actor
	orbsAddress [20]byte
}

func getValidatorAddresses(validatorObjs []*validator) [][20]byte {
	addresses := make([][20]byte, 0)
	for _, v := range validatorObjs {
		addresses = append(addresses, v.address)
	}
	return addresses
}
func (g *guardian) vote(asOfBlock uint64, validators ...*validator) {
	g.voteBlock = asOfBlock
	g.votedValidators = getValidatorAddresses(validators)
}

func (f *harness) setupEthereumStateBeforeProcess(m Mockery) {
	validatorAddresses := make([][20]byte, len(f.validators))
	for i, a := range f.validators {
		validatorAddresses[i] = a.address
		mockStakeInEthereum(m, f.electionBlock, a.address, a.stake)
		mockValidatorOrbsAddressInEthereum(m, f.electionBlock, a.address, a.orbsAddress)
	}
	mockValidatorsInEthereum(m, f.electionBlock, validatorAddresses)

	for _, a := range f.guardians {
		if a.voteBlock > f.electionBlock-VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS {
			mockStakeInEthereum(m, f.electionBlock, a.address, a.stake)
			mockGuardianInEthereum(m, f.electionBlock, a.address, true)
		}
	}

	for _, d := range f.delegators {
		mockStakeInEthereum(m, f.electionBlock, d.address, d.stake)
	}
}

func (f *harness) setupOrbsStateBeforeProcess() {
	_setCurrentElectionBlockNumber(f.electionBlock)
	f.mockDelegationsInOrbsBeforeProcess()
	f.mockGuardianVotesInOrbsBeforeProcess()
	f.mockValidatorsInOrbsBeforeProcess()
}

func newHarness() *harness {
	ETHEREUM_STAKE_FACTOR = big.NewInt(int64(10000))
	VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS = 3
	VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS = 500
	ELECTION_PERIOD_LENGTH_IN_BLOCKS = 200
	MIN_ELECTED_VALIDATORS = 3
	MAX_ELECTED_VALIDATORS = 10
	return &harness{nextGuardianAddress: 0xa1, nextDelegatorAddress: 0xb1, nextValidatorAddress: 0xd1, nextValidatorOrbsAddress: 0xe1}
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

func (f *harness) mockGuardianVotesInOrbsBeforeProcess() {
	_setNumberOfGurdians(len(f.guardians))
	for i, guardian := range f.guardians {
		_setCandidates(guardian.address[:], guardian.votedValidators)
		state.WriteUint64(_formatGuardianBlockNumberKey(guardian.address[:]), guardian.voteBlock)
		state.WriteUint64(_formatGuardianStakeKey(guardian.address[:]), 12)
		state.WriteBytes(_formatGuardianIterator(i), guardian.address[:])
	}
}

func (f *harness) mockDelegationsInOrbsBeforeProcess() {
	_setNumberOfDelegators(len(f.delegators))
	for i, d := range f.delegators {
		state.WriteBytes(_formatDelegatorAgentKey(d.address[:]), d.delegate[:])
		state.WriteBytes(_formatDelegatorIterator(i), d.address[:])
	}
}

func (f *harness) mockValidatorsInOrbsBeforeProcess() {
	_setNumberOfValidValidaors(len(f.validators))
	for i, v := range f.validators {
		state.WriteBytes(_formatValidValidaorIterator(i), v.address[:])
	}
}

func (f *harness) addValidator() *validator {
	return f.addValidatorWithStake(0)
}
func (f *harness) addValidatorWithStake(stake int) *validator {
	v := &validator{actor: actor{stake: stake, address: [20]byte{f.nextValidatorAddress}}, orbsAddress: [20]byte{f.nextValidatorOrbsAddress}}
	f.nextValidatorAddress++
	f.nextValidatorOrbsAddress++
	f.validators = append(f.validators, v)
	return v
}

func mockGuardianInEthereum(m Mockery, blockNumber uint64, address [20]byte, isGuardian bool) {
	m.MockEthereumCallMethodAtBlock(blockNumber, getGuardiansEthereumContractAddress(), getGuardiansAbi(), "isGuardian", func(out interface{}) {
		i, ok := out.(*bool)
		if ok {
			*i = isGuardian
		} else {
			panic(fmt.Sprintf("wrong something %s", out))
		}
	}, address)
}

func mockValidatorsInEthereum(m Mockery, blockNumber uint64, addresses [][20]byte) {
	m.MockEthereumCallMethodAtBlock(blockNumber, getValidatorsEthereumContractAddress(), getValidatorsAbi(), "getValidators", func(out interface{}) {
		ethAddresses, ok := out.(*[][20]byte)
		if ok {
			*ethAddresses = addresses
		} else {
			panic(fmt.Sprintf("wrong type %s", out))
		}
	})
}

func mockValidatorOrbsAddressInEthereum(m Mockery, blockNumber uint64, validatorAddress [20]byte, orbsValidatorAddress [20]byte) {
	m.MockEthereumCallMethodAtBlock(blockNumber, getValidatorsRegistryEthereumContractAddress(), getValidatorsRegistryAbi(),
		"getOrbsAddress", func(out interface{}) {
			orbsAddress, ok := out.(*[20]byte)
			if ok {
				*orbsAddress = orbsValidatorAddress
			} else {
				panic(fmt.Sprintf("wrong something %s", out))
			}
		}, validatorAddress)
}

func mockStakeInEthereum(m Mockery, BlockNumber uint64, address [20]byte, stake int) {
	stakeValue := big.NewInt(int64(stake))
	stakeValue = stakeValue.Mul(stakeValue, ETHEREUM_STAKE_FACTOR)
	m.MockEthereumCallMethodAtBlock(BlockNumber, getTokenEthereumContractAddress(), getTokenAbi(), "balanceOf", func(out interface{}) {
		i, ok := out.(**big.Int)
		if ok {
			*i = stakeValue
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

	var v1, v2, v3, v4, v5 = h.addValidator(), h.addValidator(), h.addValidator(), h.addValidator(), h.addValidator()
	var g1, g2, g3, g4, g5 = h.addGuardian(100), h.addGuardian(200), h.addGuardian(400), h.addGuardian(1000), h.addGuardian(10000000)

	g1.vote(aRecentVoteBlock, v2, v1)
	g2.vote(aRecentVoteBlock, v2, v1)
	g3.vote(aRecentVoteBlock, v2, v3)
	g4.vote(aRecentVoteBlock, v2, v5)
	g5.vote(anAncientVoteBlock, v4)

	for i := 0; i < 10; i++ {
		h.addDelegator(500, g3.address)
	}

	d1 := h.addDelegator(500, g4.address)
	d2 := h.addDelegator(500, d1.address)
	h.addDelegator(500, d2.address)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		h.setupEthereumStateBeforeProcess(m)
		h.setupOrbsStateBeforeProcess()

		// call
		elected := _processVotingStateMachine()
		i := 0
		expectedNumOfStateTransitions := len(h.guardians) + len(h.delegators) + len(h.validators) + 2
		for i := 0; i < expectedNumOfStateTransitions && elected == nil; i++ {
			elected = _processVotingStateMachine()
		}

		// assert
		m.VerifyMocks()
		require.True(t, i <= expectedNumOfStateTransitions, "did not finish in correct amount of passes")
		require.EqualValues(t, "", _getVotingProcessState())
		require.ElementsMatch(t, [][20]byte{v1.address, v3.address, v4.address, v5.address}, elected)
		require.EqualValues(t, 40, getCumulativeParticipationReward(d2.address[:]))
		require.EqualValues(t, 8, getCumulativeParticipationReward(g1.address[:]))
		require.EqualValues(t, 80, getCumulativeParticipationReward(g4.address[:]))
		require.EqualValues(t, 16, getCumulativeParticipationReward(g2.address[:]))
		require.EqualValues(t, 32, getCumulativeParticipationReward(g3.address[:]))
	})
}

func TestOrbsVotingContract_processVote_validValidatorsFromEthereumToState(t *testing.T) {
	electionBlock := uint64(60000)
	validators := [][20]byte{{0x01}, {0x02}}

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		mockValidatorsInEthereum(m, electionBlock, validators)
		_setCurrentElectionBlockNumber(electionBlock)

		// call
		_readValidValidatorsFromEthereumToState()
		stateValidators := _getValidValidators()

		// assert
		m.VerifyMocks()
		require.EqualValues(t, len(validators), _getNumberOfValidValidaors())
		for i := 0; i < _getNumberOfValidValidaors(); i++ {
			require.EqualValues(t, validators[i], _getValidValidatorEthereumAddressAtIndex(i))
		}
		require.EqualValues(t, len(validators), len(stateValidators))
		for i := 0; i < len(validators); i++ {
			require.EqualValues(t, validators[i], stateValidators[i])
		}
	})
}

func TestOrbsVotingContract_processVote_collectValidatorDataFromEthereum(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)

	var v1, v2 = h.addValidatorWithStake(100), h.addValidatorWithStake(200)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		h.setupOrbsStateBeforeProcess()
		mockValidatorOrbsAddressInEthereum(m, h.electionBlock, v1.address, v1.orbsAddress)
		mockStakeInEthereum(m, h.electionBlock, v1.address, 250)
		mockValidatorOrbsAddressInEthereum(m, h.electionBlock, v2.address, v2.orbsAddress)
		mockStakeInEthereum(m, h.electionBlock, v2.address, 450)
		_setVotingProcessItem(0)

		// call
		i := 0
		for ; i < 2; i++ {
			_collectNextValidatorDataFromEthereum()
		}

		// assert
		m.VerifyMocks()
		require.EqualValues(t, i, _getVotingProcessItem())
		require.EqualValues(t, 250, state.ReadUint64(_formatValidValidatorStakeKey(v1.address[:])))
		require.EqualValues(t, v1.orbsAddress[:], state.ReadBytes(_formatValidValidatorOrbsAddressKey(v1.address[:])))
		require.EqualValues(t, 450, state.ReadUint64(_formatValidValidatorStakeKey(v2.address[:])))
		require.EqualValues(t, v2.orbsAddress[:], state.ReadBytes(_formatValidValidatorOrbsAddressKey(v2.address[:])))
	})
}

func TestOrbsVotingContract_processVote_collectOneGuardianStakeFromEthereum_NoStateAddr_DoesntFail(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		h.setupOrbsStateBeforeProcess()

		// call
		_collectOneGuardianStakeFromEthereum(0)

		// assert
		m.VerifyMocks()
	})
}

func TestOrbsVotingContract_processVote_collectGuardiansStakeFromEthereum(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)
	aRecentVoteBlock := h.electionBlock - 1

	var v1 = h.addValidator()
	var g1, g2 = h.addGuardian(100), h.addGuardian(200)

	g1.vote(aRecentVoteBlock, v1)
	g2.vote(aRecentVoteBlock, v1)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		h.setupOrbsStateBeforeProcess()
		mockStakeInEthereum(m, h.electionBlock, g1.address, 400)
		mockGuardianInEthereum(m, h.electionBlock, g1.address, true)
		mockStakeInEthereum(m, h.electionBlock, g2.address, 600)
		mockGuardianInEthereum(m, h.electionBlock, g2.address, true)
		_setVotingProcessItem(0)

		// call
		i := 0
		for ; i < 2; i++ {
			_collectNextGuardianStakeFromEthereum()
		}

		// assert
		m.VerifyMocks()
		require.EqualValues(t, i, _getVotingProcessItem())
		require.EqualValues(t, 400, state.ReadUint64(_formatGuardianStakeKey(g1.address[:])))
		require.EqualValues(t, 600, state.ReadUint64(_formatGuardianStakeKey(g2.address[:])))
	})
}

func TestOrbsVotingContract_processVote_collectGuardiansStakeFromEthereum_AncientGuardianStakeIs0(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)
	anAncientVoteBlock := h.electionBlock - 2*VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS - 2

	var v1 = h.addValidator()
	var g3, g4 = h.addGuardian(100), h.addGuardian(200)

	g3.vote(anAncientVoteBlock, v1)
	g4.vote(0, v1) // fake didn't vote

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		h.setupOrbsStateBeforeProcess()
		_setVotingProcessItem(0)

		// call
		i := 0
		for ; i < 2; i++ {
			_collectNextGuardianStakeFromEthereum()
		}

		// assert
		m.VerifyMocks()
		require.EqualValues(t, g3.address, _getGuardianAtIndex(0))
		require.EqualValues(t, 0, state.ReadUint64(_formatGuardianStakeKey(g3.address[:])))
		require.EqualValues(t, g4.address, _getGuardianAtIndex(1))
		require.EqualValues(t, 0, state.ReadUint64(_formatGuardianStakeKey(g4.address[:])))
	})
}

func TestOrbsVotingContract_processVote_collectGuardiansStakeFromEthereum_NotGuardianStakeIs0(t *testing.T) {
	h := newHarness()
	h.electionBlock = uint64(60000)
	aRecentVoteBlock := h.electionBlock - 1

	var v1 = h.addValidator()
	var g1 = h.addGuardian(100)

	g1.vote(aRecentVoteBlock, v1)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		h.setupOrbsStateBeforeProcess()

		mockGuardianInEthereum(m, h.electionBlock, g1.address, false)
		_setVotingProcessItem(0)

		// call
		_collectNextGuardianStakeFromEthereum()

		// assert
		m.VerifyMocks()
		require.EqualValues(t, 0, state.ReadUint64(_formatGuardianStakeKey(g1.address[:])))
		require.EqualValues(t, g1.address, _getGuardianAtIndex(0))
	})
}

func TestOrbsVotingContract_processVote_collectOneDelegatorStakeFromEthereum_NoStateAddr_DoesntFail(t *testing.T) {
	electionBlock := uint64(60000)

	InServiceScope(nil, nil, func(m Mockery) {
		_init()

		// prepare
		_setCurrentElectionBlockNumber(electionBlock)
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
		h.setupOrbsStateBeforeProcess()
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
		h.setupOrbsStateBeforeProcess()

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
		h.setupOrbsStateBeforeProcess()

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
		h.setupOrbsStateBeforeProcess()

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
		name                   string
		expect                 uint64
		relationship           map[[20]byte][][20]byte
		expectParticipantStake map[[20]byte]uint64 // will not include the guardian stake in it.
	}{
		{"simple one delegate", 200, map[[20]byte][][20]byte{{0xa0}: {{0xb1}}}, map[[20]byte]uint64{{0xb1}: 200}},
		{"simple two delegates", 600, map[[20]byte][][20]byte{{0xa0}: {{0xb1}, {0xb3}}}, map[[20]byte]uint64{{0xb3}: 400, {0xb1}: 200}},
		{"simple all delegates", 1000, map[[20]byte][][20]byte{{0xa0}: {{0xb1}, {0xb0}, {0xb2}, {0xb3}}}, map[[20]byte]uint64{{0xb3}: 400, {0xb2}: 300, {0xb1}: 200, {0xb0}: 100}},
		{"level one has another delegate", 500, map[[20]byte][][20]byte{{0xa0}: {{0xb1}}, {0xb1}: {{0xb2}}}, map[[20]byte]uint64{{0xb2}: 300, {0xb1}: 200}},
		{"simple and level one has another delegate", 600, map[[20]byte][][20]byte{{0xa0}: {{0xb0}, {0xb1}}, {0xb1}: {{0xb2}}}, map[[20]byte]uint64{{0xb2}: 300, {0xb1}: 200, {0xb0}: 100}},
		{"level one has another two delegate", 900, map[[20]byte][][20]byte{{0xa0}: {{0xb1}}, {0xb1}: {{0xb2}, {0xb3}}}, map[[20]byte]uint64{{0xb2}: 300, {0xb1}: 200, {0xb3}: 400}},
		{"level two has level one has another two delegate", 1000, map[[20]byte][][20]byte{{0xa0}: {{0xb0}}, {0xb0}: {{0xb1}}, {0xb1}: {{0xb2}, {0xb3}}}, map[[20]byte]uint64{{0xb3}: 400, {0xb2}: 300, {0xb1}: 200, {0xb0}: 100}},
	}
	for i := range tests {
		cTest := tests[i]
		t.Run(cTest.name, func(t *testing.T) {
			participant := make(map[[20]byte]uint64)
			stakes := _calculateOneGuardianVoteRecursive(guardian, cTest.relationship, delegatorStakes, participant)
			require.EqualValues(t, cTest.expect, stakes, fmt.Sprintf("%s was calculated to %d instead of %d", cTest.name, stakes, cTest.expect))
			require.EqualValues(t, len(cTest.expectParticipantStake), len(participant), "participants length not equal")
			for k, v := range participant {
				require.EqualValues(t, cTest.expectParticipantStake[k], v, "bad values")
			}
		})
	}
}

func TestOrbsVotingContract_processVote_guardiansCastVotes(t *testing.T) {
	g0, g1, g2, g3 := [20]byte{0xa0}, [20]byte{0xa1}, [20]byte{0xa2}, [20]byte{0xa3}
	delegatorStakes := map[[20]byte]uint64{
		{0xa0, 0xb0}: 100, {0xa0, 0xb1}: 200,
		{0xa1, 0xb0}: 100, {0xa1, 0xb1}: 200, {0xa1, 0xb2}: 300,
		{0xa2, 0xb0}: 100, {0xa2, 0xb1}: 200, {0xa2, 0xb2}: 300, {0xa2, 0xb3}: 400,
	}
	relationship := map[[20]byte][][20]byte{
		g0: {{0xa0, 0xb0}, {0xa0, 0xb1}},                               // 300
		g1: {{0xa1, 0xb0}, {0xa1, 0xb1}}, {0xa1, 0xb1}: {{0xa1, 0xb2}}, // 600
		g2: {{0xa2, 0xb0}}, {0xa2, 0xb0}: {{0xa2, 0xb1}}, {0xa2, 0xb1}: {{0xa2, 0xb2}, {0xa2, 0xb3}}, // 1000
	}
	v1, v2, v3, v4, v5 := [20]byte{0xc1}, [20]byte{0xc2}, [20]byte{0xc3}, [20]byte{0xc4}, [20]byte{0xc5}
	g0Vote := [][20]byte{v1, v2}
	g1Vote := [][20]byte{v3, v4, v5}
	g2Vote := [][20]byte{v1, v3, v5}
	g3Vote := make([][20]byte, 0) // voted for nonec

	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		_setCandidates(g0[:], g0Vote)
		_setCandidates(g1[:], g1Vote)
		_setCandidates(g2[:], g2Vote)
		_setCandidates(g3[:], g3Vote)
		_setCurrentElectionBlockNumber(50000)

		tests := []struct {
			name          string
			expect        map[[20]byte]uint64
			expectedTotal uint64
			guardianStake map[[20]byte]uint64
		}{
			{"simple one guardian", map[[20]byte]uint64{v1: 320, v2: 320}, 320, map[[20]byte]uint64{g0: 20}},
			{"simple two guardian", map[[20]byte]uint64{v1: 320, v2: 320, v3: 700, v4: 700, v5: 700}, 1020, map[[20]byte]uint64{g0: 20, g1: 100}},
			{"simple three guardian", map[[20]byte]uint64{v1: 1330, v2: 320, v3: 1710, v4: 700, v5: 1710}, 2030, map[[20]byte]uint64{g0: 20, g1: 100, g2: 10}},
			{"simple second guardian no delegates", map[[20]byte]uint64{v1: 320, v2: 320}, 370, map[[20]byte]uint64{g0: 20, g3: 50}},
		}
		for i := range tests {
			cTest := tests[i]
			candidatesVotes, total, _, _ := _guardiansCastVotes(cTest.guardianStake, relationship, delegatorStakes)
			// TODO v1 Noam ... check this ?
			require.EqualValues(t, cTest.expectedTotal, total)
			for validator, vote := range cTest.expect {
				require.EqualValues(t, vote, candidatesVotes[validator])
			}
		}
	})
}

func TestOrbsVotingContract_processVote_processValidatorsSelection(t *testing.T) {
	v1, v2, v3, v4, v5 := [20]byte{0xc1}, [20]byte{0xc2}, [20]byte{0xc3}, [20]byte{0xc4}, [20]byte{0xc5}

	tests := []struct {
		name     string
		expect   [][20]byte
		original map[[20]byte]uint64
		maxVotes uint64
	}{
		{"all pass", [][20]byte{v1, v2, v3, v4}, map[[20]byte]uint64{v1: 320, v2: 200, v3: 400, v4: 500}, 1000},
		{"one voted out", [][20]byte{v1, v3, v4}, map[[20]byte]uint64{v1: 320, v2: 701, v3: 400, v4: 699}, 1000},
		{"non valid also voted out", [][20]byte{v1, v3, v4}, map[[20]byte]uint64{v1: 320, v2: 701, v3: 400, v4: 699, v5: 400}, 1000},
	}
	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		_setNumberOfValidValidaors(4)
		_setValidValidatorEthereumAddressAtIndex(0, v1[:])
		_setValidValidatorEthereumAddressAtIndex(1, v2[:])
		_setValidValidatorEthereumAddressAtIndex(2, v3[:])
		_setValidValidatorEthereumAddressAtIndex(3, v4[:])
		_setCurrentElectionBlockNumber(50000)

		for i := range tests {
			cTest := tests[i]
			validCandidates := _processValidatorsSelection(cTest.original, cTest.maxVotes)
			require.Equal(t, len(cTest.expect), len(validCandidates))
			require.ElementsMatch(t, cTest.expect, validCandidates)
		}
	})
}

func TestOrbsVotingContract_initCurrentElectionBlockNumber(t *testing.T) {
	t.Skip() // TODO v1 fix the fake sdk
	tests := []struct {
		name                     string
		expectCurrentBlockNumber uint64
		ethereumBlockNumber      uint64
	}{
		{"before is 0", FIRST_ELECTION_BLOCK, 0},
		{"before is a small number", FIRST_ELECTION_BLOCK, 5000000},
		{"before is after first but before second", FIRST_ELECTION_BLOCK + ELECTION_PERIOD_LENGTH_IN_BLOCKS, 7480969},
		{"before is after second", FIRST_ELECTION_BLOCK + 2*ELECTION_PERIOD_LENGTH_IN_BLOCKS, 7495969},
	}
	for i := range tests {
		cTest := tests[i]
		t.Run(cTest.name, func(t *testing.T) {
			InServiceScope(nil, nil, func(m Mockery) {
				_init()
				_setCurrentElectionBlockNumber(0)
				m.MockEthereumGetBlockNumber(int(cTest.ethereumBlockNumber))
				after := _getCurrentElectionBlockNumber()
				require.EqualValues(t, cTest.expectCurrentBlockNumber, after, "'%s' failed ", cTest.name)
			})
		})
	}
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
	_setCurrentElectionBlockNumber(electionBlock)
}
