package main

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/ethereum"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/safemath/safeuint64"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/service"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	"math/big"
	"sort"
)

var PUBLIC = sdk.Export(getTokenAddr, getTokenAbi, getVotingAddr, getVotingAbi, getValidatorsAddr, getValidatorsAbi, getOrbsConfigContract,
	setTokenAddr, setVotingAddr, setValidatorsAddr, /* TODO v1 security run once after deploy */
	setVariables_unsafe, // TODO v1 noam unsafe
	mirrorDelegationByTransfer, mirrorDelegation, mirrorVote,
	processVoting,
	setFirstElectionBlockNumber)
var SYSTEM = sdk.Export(_init, setTokenAbi, setVotingAbi, setValidatorsAbi, setOrbsValidatorsConfigContract)

// defaults other contracts
const defaultOrbsValidatorsConfigContract = "OrbsValidatorsConfig"
const defaultTokenAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
const defaultTokenAddr = "0x5B31Ea29271Cc0De13E17b67a8f94Dd0b8F4B959"
const defaultVotingAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"nodes","type":"bytes20[]"},{"indexed":false,"name":"vote_counter","type":"uint256"}],"name":"Vote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegation_counter","type":"uint256"}],"name":"Delegate","type":"event"},{"constant":false,"inputs":[{"name":"nodes","type":"address[]"}],"name":"vote","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]`
const defaultVotingAddr = "0x201e10E4Fa7f232F93c387928d3e453030e59166"
const defaultValidatorsAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorRemoved","type":"event"},{"constant":false,"inputs":[{"name":"_validator","type":"address"}],"name":"addValidator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"m","type":"address"}],"name":"isValidator","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getValidators","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"}]`
const defaultValidatorsAddr = "0xDa7AD27C7969985968494303F41051144dc92B36"

// parameters
var DELEGATION_NAME = "Delegate"
var DELEGATION_BY_TRANSFER_NAME = "Transfer"
var DELEGATION_BY_TRANSFER_VALUE = big.NewInt(7)
var ETHEREUM_STAKE_FACTOR = big.NewInt(1000000000000000000)
var VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS = uint64(600)
var VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS = uint64(50000)
var ELECTION_PERIOD_LENGTH_IN_BLOCKS = uint64(20000)
var VOTES_PER_TOKEN = 5
var ELECTED_VALIDATORS = 5

func _init() {
	setTokenAbi(defaultTokenAbi)
	setTokenAddr(defaultTokenAddr)
	setVotingAbi(defaultVotingAbi)
	setVotingAddr(defaultVotingAddr)
	setValidatorsAbi(defaultValidatorsAbi)
	setValidatorsAddr(defaultValidatorsAddr)
	setOrbsValidatorsConfigContract(defaultOrbsValidatorsConfigContract)
}

// TODO v1 noam unsafe function
func setVariables_unsafe(stakeFactor uint64, voteMirrorPeriod uint64, voteValidPeriod uint64, electionPeriod uint64, votesPerToke uint32, electedValidators uint32) {
	ETHEREUM_STAKE_FACTOR = big.NewInt(int64(stakeFactor))
	VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS = voteMirrorPeriod
	VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS = voteValidPeriod
	ELECTION_PERIOD_LENGTH_IN_BLOCKS = electionPeriod
	VOTES_PER_TOKEN = int(votesPerToke)
	ELECTED_VALIDATORS = int(electedValidators)
}

type Transfer struct {
	From  [20]byte
	To    [20]byte
	Value *big.Int
}

func mirrorDelegationByTransfer(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Transfer{}
	eventBlockNumber, eventBlockTxIndex := ethereum.GetTransactionLog(getTokenAddr(), getTokenAbi(), hexEncodedEthTxHash, DELEGATION_BY_TRANSFER_NAME, e)

	if DELEGATION_BY_TRANSFER_VALUE.Cmp(e.Value) != 0 {
		panic(fmt.Errorf("mirrorDelegateByTransfer from %v to %v failed since %d is wrong delegation value", e.From, e.To, e.Value.Uint64()))
	}

	_mirrorDelegationData(e.From[:], e.To[:], eventBlockNumber, eventBlockTxIndex, DELEGATION_BY_TRANSFER_NAME)
}

type Delegate struct {
	Delegator [20]byte
	To        [20]byte
}

func mirrorDelegation(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Delegate{}
	eventBlockNumber, eventBlockTxIndex := ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, DELEGATION_NAME, e)

	_mirrorDelegationData(e.Delegator[:], e.To[:], eventBlockNumber, eventBlockTxIndex, DELEGATION_NAME)
}

func _mirrorPeriodValidator() {
	currentBlock := ethereum.GetBlockNumber()
	if _isAfterElectionMirroring(currentBlock) {
		panic(fmt.Errorf("current block number (%d) indicates mirror period for election (%d) has ended, resubmit next election", currentBlock, _getElectionBlockNumber()))
	}
}

func _mirrorDelegationData(delegator []byte, agent []byte, eventBlockNumber uint64, eventBlockTxIndex uint32, eventName string) {
	electionBlockNumber := _getElectionBlockNumber()
	if eventBlockNumber > electionBlockNumber {
		panic(fmt.Errorf("delegate with medthod %s from %v to %v failed since it happened in block number %d which is after election date (%d), resubmit next election",
			eventName, delegator, agent, eventBlockNumber, electionBlockNumber))
	}
	stateMethod := state.ReadString(_formatDelegatorMethod(delegator))
	stateBlockNumber := uint64(0)
	if stateMethod == DELEGATION_NAME && eventName == DELEGATION_BY_TRANSFER_NAME {
		panic(fmt.Errorf("delegate with medthod %s from %v to %v failed since already have delegation with method %s",
			eventName, delegator, agent, stateMethod))
	} else if stateMethod == eventName {
		stateBlockNumber = state.ReadUint64(_formatDelegatorBlockNumberKey(delegator))
		stateBlockTxIndex := state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegator))
		if stateBlockNumber > eventBlockNumber || (stateBlockNumber == eventBlockNumber && stateBlockTxIndex > eventBlockTxIndex) {
			panic(fmt.Errorf("delegate from %v to %v with block-height %d and tx-index %d failed since already have newer block-height %d and tx-index %d",
				delegator, agent, eventBlockNumber, eventBlockTxIndex, stateBlockNumber, stateBlockTxIndex))
		}
	}

	if stateBlockNumber == 0 { // new delegator
		numOfDelegators := _getNumberOfDelegators()
		_setDelegatorAtIndex(numOfDelegators, delegator)
		_setNumberOfDelegators(numOfDelegators + 1)
	}

	state.WriteBytes(_formatDelegatorAgentKey(delegator), agent)
	state.WriteUint64(_formatDelegatorBlockNumberKey(delegator), eventBlockNumber)
	state.WriteUint32(_formatDelegatorBlockTxIndexKey(delegator), eventBlockTxIndex)
	state.WriteString(_formatDelegatorMethod(delegator), eventName)
}

var DELEGATOR_COUNT = []byte("Delegator_Address_Count")

func _getNumberOfDelegators() int {
	return int(state.ReadUint32(DELEGATOR_COUNT))
}

func _setNumberOfDelegators(numberOfDelegators int) {
	state.WriteUint32(DELEGATOR_COUNT, uint32(numberOfDelegators))
}

func _getDelegatorAtIndex(index int) [20]byte {
	return _addressSliceToArray(state.ReadBytes(_formatDelegatorIterator(index)))
}

func _setDelegatorAtIndex(index int, delegator []byte) {
	state.WriteBytes(_formatDelegatorIterator(index), delegator)
}

func _formatDelegatorIterator(num int) []byte {
	return []byte(fmt.Sprintf("Delegator_Address_%d", num))
}

func _getDelegatorGuardian(delegator []byte) [20]byte {
	return _addressSliceToArray(state.ReadBytes(_formatDelegatorAgentKey(delegator)))
}

func _formatDelegatorAgentKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Delegator_%s_Agent", hex.EncodeToString(delegator)))
}

func _formatDelegatorBlockNumberKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Delegator_%s_BlockNumber", hex.EncodeToString(delegator)))
}

func _formatDelegatorBlockTxIndexKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Delegator_%s_BlockTxIndex", hex.EncodeToString(delegator)))
}

func _formatDelegatorMethod(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Delegator_%s_Method", hex.EncodeToString(delegator)))
}

func _formatDelegatorStakeKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Delegator_%s_Stake", hex.EncodeToString(delegator)))
}

type Vote struct {
	Voter [20]byte
	Nodes [][20]byte
}

func mirrorVote(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Vote{}
	eventBlockNumber, eventBlockTxIndex := ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, "Vote", e)
	electionBlockNumber := _getElectionBlockNumber()
	if eventBlockNumber > electionBlockNumber {
		panic(fmt.Errorf("vote of guardian %v to %v failed since it happened in block number %d which is after election date (%d), resubmit next election",
			e.Voter, e.Nodes, eventBlockNumber, electionBlockNumber))
	}
	stateBlockNumber := state.ReadUint64(_formatGuardianBlockNumberKey(e.Voter[:]))
	stateBlockTxIndex := state.ReadUint32(_formatGuardianBlockTxIndexKey(e.Voter[:]))
	if stateBlockNumber > eventBlockNumber || (stateBlockNumber == eventBlockNumber && stateBlockTxIndex > eventBlockTxIndex) {
		panic(fmt.Errorf("vote of guardian %v to %v with block-height %d and tx-index %d failed since already have newer block-height %d and tx-index %d",
			e.Voter, e.Nodes, eventBlockNumber, eventBlockTxIndex, stateBlockNumber, stateBlockTxIndex))
	}

	if stateBlockNumber == 0 { // new guardian
		numOfGuardians := _getNumberOfGurdians()
		_setGuardianAtIndex(numOfGuardians, e.Voter[:])
		_setNumberOfGurdians(numOfGuardians + 1)
	}

	// TODO v1 noam due-diligent guardian missing

	_setCandidates(e.Voter[:], e.Nodes)
	state.WriteUint64(_formatGuardianBlockNumberKey(e.Voter[:]), eventBlockNumber)
	state.WriteUint32(_formatGuardianBlockTxIndexKey(e.Voter[:]), eventBlockTxIndex)
}

var GUARDIAN_COUNT = []byte("Guardian_Address_Count")

func _getNumberOfGurdians() int {
	return int(state.ReadUint32(GUARDIAN_COUNT))
}

func _setNumberOfGurdians(numberOfGuardians int) {
	state.WriteUint32(GUARDIAN_COUNT, uint32(numberOfGuardians))
}

func _formatGuardianIterator(num int) []byte {
	return []byte(fmt.Sprintf("Guardian_Address_%d", num))
}

func _getGuardianAtIndex(index int) [20]byte {
	return _addressSliceToArray(state.ReadBytes(_formatGuardianIterator(index)))
}

func _setGuardianAtIndex(index int, guardian []byte) {
	state.WriteBytes(_formatGuardianIterator(index), guardian)
}

func _formatGuardianCandidateKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_%s_Candidates", hex.EncodeToString(guardian)))
}

func _getCandidates(guardian []byte) [][20]byte {
	candidates := state.ReadBytes(_formatGuardianCandidateKey(guardian))
	numCandidate := len(candidates) / 20
	candidatesList := make([][20]byte, numCandidate)
	for i := 0; i < numCandidate; i++ {
		copy(candidatesList[i][:], candidates[i*20:i*20+20])
	}
	return candidatesList
}

func _setCandidates(guardian []byte, candidateList [][20]byte) {
	candidates := make([]byte, 0, len(candidateList)*20)
	for _, v := range candidateList {
		candidates = append(candidates, v[:]...)
	}

	state.WriteBytes(_formatGuardianCandidateKey(guardian), candidates)
}

func _formatGuardianBlockNumberKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_%s_BlockNumber", hex.EncodeToString(guardian)))
}

func _formatGuardianBlockTxIndexKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_%s_BlockTxIndex", hex.EncodeToString(guardian)))
}

func _formatGuardianStakeKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_%s_Stake", hex.EncodeToString(guardian)))
}

func processVoting() uint64 {
	currentBlock := ethereum.GetBlockNumber()
	if !_isAfterElectionMirroring(currentBlock) {
		panic(fmt.Sprintf("mirror period (%d) for election (%d) did not end, cannot start processing", currentBlock, _getElectionBlockNumber()))
	}

	electedValidators := _processVotingStateMachine()
	if electedValidators != nil {
		_updateElected(electedValidators)
		_setElectionBlockNumber(safeuint64.Add(_getElectionBlockNumber(), ELECTION_PERIOD_LENGTH_IN_BLOCKS))
		return 1
	} else {
		return 0
	}
}

func _updateElected(elected [][20]byte) {
	electedForSave := make([]byte, 0, len(elected)*20)
	for i := range elected {
		electedForSave = append(electedForSave, elected[i][:]...)
	}
	service.CallMethod(getOrbsConfigContract(), "updateElectionResults", electedForSave, _getElectionBlockNumber())
}

func _processVotingStateMachine() [][20]byte {
	processState := _getVotingProcessState()
	if processState == "" {
		_setVotingProcessState(VOTING_PROCESS_STATE_GUARDIANSS)
		fmt.Printf("elections %10d: moving to state %s\n", _getElectionBlockNumber(), VOTING_PROCESS_STATE_GUARDIANSS)
	}

	if processState == VOTING_PROCESS_STATE_GUARDIANSS {
		_collectNextGuardianStakeFromEthereum()
		return nil
	} else if processState == VOTING_PROCESS_STATE_DELEGATORS {
		_collectNextDelegatorStakeFromEthereum()
		return nil
	} else if processState == VOTING_PROCESS_STATE_CALCULATIONS {
		candidateVotes := _calculateVotes()
		elected := _processValidatorsSelection(candidateVotes)
		_setVotingProcessState("")
		return elected
	}
	// TODO v1 noam cleanup stage
	return nil
}

func _collectNextGuardianStakeFromEthereum() {
	nextIndex := _getVotingProcessItem()
	_collectOneGuardianStakeFromEthereum(nextIndex)
	nextIndex++
	if nextIndex >= _getNumberOfGurdians() {
		_setVotingProcessItem(0)
		_setVotingProcessState(VOTING_PROCESS_STATE_DELEGATORS)
		fmt.Printf("elections %10d: moving to state %s\n", _getElectionBlockNumber(), VOTING_PROCESS_STATE_DELEGATORS)
	} else {
		_setVotingProcessItem(nextIndex)
	}
}

func _collectOneGuardianStakeFromEthereum(i int) {
	guardian := _getGuardianAtIndex(i)
	voteBlockNumber := state.ReadUint64(_formatGuardianBlockNumberKey(guardian[:]))
	if voteBlockNumber != 0 && voteBlockNumber > safeuint64.Sub(_getElectionBlockNumber(), VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS) {
		stake := _getDelegatorStakeAtElection(guardian)
		state.WriteUint64(_formatGuardianStakeKey(guardian[:]), stake)
		fmt.Printf("elections %10d: from ethereum guardian %x, stake %d\n", _getElectionBlockNumber(), guardian, stake)
	}
}

func _collectNextDelegatorStakeFromEthereum() {
	nextIndex := _getVotingProcessItem()
	_collectOneDelegatorStakeFromEthereum(nextIndex)
	nextIndex++
	if nextIndex >= _getNumberOfDelegators() {
		_setVotingProcessItem(0)
		_setVotingProcessState(VOTING_PROCESS_STATE_CALCULATIONS)
		fmt.Printf("elections %10d: moving to state %s\n", _getElectionBlockNumber(), VOTING_PROCESS_STATE_CALCULATIONS)
	} else {
		_setVotingProcessItem(nextIndex)
	}
}

func _collectOneDelegatorStakeFromEthereum(i int) {
	delegator := _getDelegatorAtIndex(i)
	stake := _getDelegatorStakeAtElection(delegator)
	state.WriteUint64(_formatDelegatorStakeKey(delegator[:]), stake)
	fmt.Printf("elections %10d: from ethereum delegator %x , stake %d\n", _getElectionBlockNumber(), delegator, stake)
}

func _getDelegatorStakeAtElection(ethAddr [20]byte) uint64 {
	stake := new(*big.Int)
	ethereum.CallMethodAtBlock(_getElectionBlockNumber(), getTokenAddr(), getTokenAbi(), "balanceOf", stake, ethAddr)
	return ((*stake).Div(*stake, ETHEREUM_STAKE_FACTOR)).Uint64()
}

func _calculateVotes() (candidateVotes map[[20]byte]uint64) {
	guardianStakes := _collectGuardiansStake()
	delegatorStakes := _collectDelegatorsStake(guardianStakes)
	guardianToDelegators := _findGuardianDelegators(delegatorStakes)
	candidateVotes = _guardiansCastVotes(guardianStakes, guardianToDelegators, delegatorStakes)
	return
}

func _collectGuardiansStake() (guardianStakes map[[20]byte]uint64) {
	guardianStakes = make(map[[20]byte]uint64)
	numOfGuardians := _getNumberOfGurdians()
	for i := 0; i < numOfGuardians; i++ {
		guardian := _getGuardianAtIndex(i)
		voteBlockNumber := state.ReadUint64(_formatGuardianBlockNumberKey(guardian[:]))
		if voteBlockNumber != 0 && voteBlockNumber > safeuint64.Sub(_getElectionBlockNumber(), VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS) {
			stake := state.ReadUint64(_formatGuardianStakeKey(guardian[:]))
			guardianStakes[guardian] = stake
			fmt.Printf("elections %10d: guardian %x , stake %d\n", _getElectionBlockNumber(), guardian, stake)
		} else {
			fmt.Printf("elections %10d: guardian %x voted at %d is too old, ignoring as guardian \n", _getElectionBlockNumber(), guardian, voteBlockNumber)
		}
	}
	return
}

func _collectDelegatorsStake(guardianStakes map[[20]byte]uint64) (delegatorStakes map[[20]byte]uint64) {
	delegatorStakes = make(map[[20]byte]uint64)
	numOfDelegators := _getNumberOfDelegators()
	for i := 0; i < numOfDelegators; i++ {
		delegator := _getDelegatorAtIndex(i)
		if _, ok := guardianStakes[delegator]; !ok {
			stake := state.ReadUint64(_formatDelegatorStakeKey(delegator[:]))
			delegatorStakes[delegator] = stake
			fmt.Printf("elections %10d: delegator %x, stake %d\n", _getElectionBlockNumber(), delegator, stake)
		} else {
			fmt.Printf("elections %10d: delegator %x ignored as it is also a guardian\n", _getElectionBlockNumber(), delegator)
		}
	}
	return
}

func _findGuardianDelegators(delegatorStakes map[[20]byte]uint64) (guardianToDelegators map[[20]byte][][20]byte) {
	guardianToDelegators = make(map[[20]byte][][20]byte)

	for delegator := range delegatorStakes {
		guardian := _getDelegatorGuardian(delegator[:])
		if !bytes.Equal(guardian[:], delegator[:]) {
			fmt.Printf("elections %10d: delegator %x, guardian/agent %x\n", _getElectionBlockNumber(), delegator, guardian)
			guardianDelegatorList, ok := guardianToDelegators[guardian]
			if !ok {
				guardianDelegatorList = [][20]byte{}
			}
			guardianDelegatorList = append(guardianDelegatorList, delegator)
			guardianToDelegators[guardian] = guardianDelegatorList
		}
	}
	return
}

func _guardiansCastVotes(guardianStakes map[[20]byte]uint64, guardianDelegators map[[20]byte][][20]byte, delegatorStakes map[[20]byte]uint64) (candidateVotes map[[20]byte]uint64) {
	candidateVotes = make(map[[20]byte]uint64)
	for guardian, guardianStake := range guardianStakes {
		stake := safeuint64.Add(guardianStake, _calculateOneGuardianVoteRecursive(guardian, guardianDelegators, delegatorStakes))
		fmt.Printf("elections %10d: guardian %x, voting stake %d\n", _getElectionBlockNumber(), guardian, stake)

		candidateList := _getCandidates(guardian[:])
		if len(candidateList) > VOTES_PER_TOKEN {
			stake = safeuint64.Div(safeuint64.Mul(stake, uint64(VOTES_PER_TOKEN)), uint64(len(candidateList)))
			fmt.Printf("elections %10d: guardian %x, voting stake %d - reduced by votes per token\n", _getElectionBlockNumber(), guardian, stake)
		}
		for _, candidate := range candidateList {
			fmt.Printf("elections %10d: guardian %x, voted for candidate %x\n", _getElectionBlockNumber(), guardian, candidate)
			candidateVotes[candidate] = safeuint64.Add(candidateVotes[candidate], stake)
		}
	}
	return
}

func _calculateOneGuardianVoteRecursive(currentLevelGuardian [20]byte, guardianToDelegators map[[20]byte][][20]byte, delegatorStakes map[[20]byte]uint64) uint64 {
	guardianDelegatorList, ok := guardianToDelegators[currentLevelGuardian]
	currentVotes := delegatorStakes[currentLevelGuardian]
	if ok {
		for _, delegate := range guardianDelegatorList {
			currentVotes = safeuint64.Add(currentVotes, _calculateOneGuardianVoteRecursive(delegate, guardianToDelegators, delegatorStakes))
		}
	}
	return currentVotes
}

func _processValidatorsSelection(candidateVotes map[[20]byte]uint64) [][20]byte {
	var validValidators [][20]byte
	ethereum.CallMethodAtBlock(_getElectionBlockNumber(), getValidatorsAddr(), getValidatorsAbi(), "getValidators", &validValidators)

	validateCandidateVotes := _filterValidCandidateValidators(candidateVotes, validValidators)
	return _getTopElectedValidators(validateCandidateVotes)
}

func _filterValidCandidateValidators(candidateVotes map[[20]byte]uint64, validValidators [][20]byte) candidateArray {
	validCandidateVotes := make(candidateArray, 0, len(validValidators))
	for _, validValidator := range validValidators {
		if validCandidateVote, ok := candidateVotes[validValidator]; ok {
			fmt.Printf("elections %10d: candidate %x, got %d votes\n", _getElectionBlockNumber(), validValidator, validCandidateVote)
			validCandidateVotes = append(validCandidateVotes, &candidateVote{validValidator, validCandidateVote})
		}
	}
	return validCandidateVotes
}

func _getTopElectedValidators(validCandidateVotes candidateArray) [][20]byte {
	winnerListSize := ELECTED_VALIDATORS
	if len(validCandidateVotes) < winnerListSize {
		winnerListSize = len(validCandidateVotes)
	} else {
		sort.Sort(validCandidateVotes)
	}

	winners := make([][20]byte, winnerListSize)
	for i := 0; i < winnerListSize; i++ {
		fmt.Printf("elections %10d: elected %x, by %d votes\n", _getElectionBlockNumber(), validCandidateVotes[i].candidate, validCandidateVotes[i].vote)
		winners[i] = validCandidateVotes[i].candidate
	}
	return winners
}

var VOTING_PROCESS_STATE_KEY = []byte("Voting_Process_State")

const VOTING_PROCESS_STATE_DELEGATORS = "delegators"
const VOTING_PROCESS_STATE_GUARDIANSS = "guardians"
const VOTING_PROCESS_STATE_CALCULATIONS = "calculations"
const VOTING_PROCESS_STATE_CLEANUP = "cleanUp"

func _getVotingProcessState() string {
	return state.ReadString(VOTING_PROCESS_STATE_KEY)
}

func _setVotingProcessState(name string) {
	state.WriteString(VOTING_PROCESS_STATE_KEY, name)
}

var VOTING_PROCESS_ITEM_KEY = []byte("Voting_Process_Item")

func _getVotingProcessItem() int {
	return int(state.ReadUint32(VOTING_PROCESS_ITEM_KEY))
}

func _setVotingProcessItem(i int) {
	state.WriteUint32(VOTING_PROCESS_ITEM_KEY, uint32(i))
}

/*****
 * timings
 */
var ELECTION_BLOCK_NUMBER = []byte("Election_Block_Number")

func _getElectionBlockNumber() uint64 {
	return state.ReadUint64(ELECTION_BLOCK_NUMBER)
}

func _setElectionBlockNumber(BlockNumber uint64) {
	state.WriteUint64(ELECTION_BLOCK_NUMBER, BlockNumber)
}

func setFirstElectionBlockNumber(BlockNumber uint64) {
	if _getElectionBlockNumber() == 0 {
		state.WriteUint64(ELECTION_BLOCK_NUMBER, BlockNumber)
	}
}

func _isAfterElectionMirroring(BlockNumber uint64) bool {
	return BlockNumber > _getElectionBlockNumber()+VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS
}

/***
 * Helpers
 */
func _addressSliceToArray(a []byte) [20]byte {
	var array [20]byte
	copy(array[:], a)
	return array
}

/***
 * Sort top elected using sort.Interface
 */
type candidateVote struct {
	candidate [20]byte
	vote      uint64
}
type candidateArray []*candidateVote

func (s candidateArray) Len() int {
	return len(s)
}

func (s candidateArray) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s candidateArray) Less(i, j int) bool {
	return s[i].vote > s[j].vote
}

/*****
 * Connections to other contracts - TODO v1 is this temp
 */
var ORBS_CONFIG_CONTRACT_KEY = []byte("_TOKEN_CONTRACT_KEY_")
var TOKEN_ETH_ADDR_KEY = []byte("_TOKEN_ETH_ADDR_KEY_")
var TOKEN_ABI_KEY = []byte("_TOKEN_ABI_KEY_")
var VOTING_ETH_ADDR_KEY = []byte("_VOTING_ETH_ADDR_KEY_")
var VOTING_ABI_KEY = []byte("_VOTING_ABI_KEY_")
var VALIDATORS_ETH_ADDR_KEY = []byte("_VALIDATORS_ETH_ADDR_KEY_")
var VALIDATORS_ABI_KEY = []byte("_VALIDATORS_ABI_KEY_")

func getOrbsConfigContract() string {
	return state.ReadString(ORBS_CONFIG_CONTRACT_KEY)
}

func setOrbsValidatorsConfigContract(name string) { // upgrade
	state.WriteString(ORBS_CONFIG_CONTRACT_KEY, name)
}

func getTokenAddr() string {
	return state.ReadString(TOKEN_ETH_ADDR_KEY)
}

func setTokenAddr(addr string) { // upgrade
	state.WriteString(TOKEN_ETH_ADDR_KEY, addr)
}

func getTokenAbi() string {
	return state.ReadString(TOKEN_ABI_KEY)
}

func setTokenAbi(abi string) { // upgrade
	state.WriteString(TOKEN_ABI_KEY, abi)
}

func getVotingAddr() string {
	return state.ReadString(VOTING_ETH_ADDR_KEY)
}

func setVotingAddr(addr string) { // upgrade
	state.WriteString(VOTING_ETH_ADDR_KEY, addr)
}

func getVotingAbi() string {
	return state.ReadString(VOTING_ABI_KEY)
}

func setVotingAbi(abi string) { // upgrade
	state.WriteString(VOTING_ABI_KEY, abi)
}

func getValidatorsAddr() string {
	return state.ReadString(VALIDATORS_ETH_ADDR_KEY)
}

func setValidatorsAddr(addr string) { // upgrade
	state.WriteString(VALIDATORS_ETH_ADDR_KEY, addr)
}

func getValidatorsAbi() string {
	return state.ReadString(VALIDATORS_ABI_KEY)
}

func setValidatorsAbi(abi string) { // upgrade
	state.WriteString(VALIDATORS_ABI_KEY, abi)
}
