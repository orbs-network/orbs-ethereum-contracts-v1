package main

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/env"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/ethereum"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/safemath/safeuint64"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	"math/big"
)

var PUBLIC = sdk.Export(getTokenEthereumContractAddress, getGuardiansEthereumContractAddress, getVotingEthereumContractAddress, getValidatorsEthereumContractAddress,
	unsafetests_setTokenAddr, unsafetests_setGuardiansAddr, unsafetests_setVotingAddr, unsafetests_setValidatorsAddr, // TODO v1 noam unsafe
	unsafetests_setVariables, unsafetests_setElectedValidators, unsafetests_setElectedBlockNumber, // TODO v1 noam unsafe
	mirrorDelegationByTransfer, mirrorDelegation, mirrorVote,
	processVoting,
	getElectedValidators, getElectedValidatorsByBlockNumber, getElectedValidatorsByBlockHeight,
	getElectedValidatorsByIndex, getElectedValidatorsBlockNumberByIndex, getElectedValidatorsBlockHeightByIndex, getNumberOfElections,
)
var SYSTEM = sdk.Export(_init)

// parameters
var DELEGATION_NAME = "Delegate"
var DELEGATION_BY_TRANSFER_NAME = "Transfer"
var VOTE_OUT_NAME = "VoteOut"
var DELEGATION_BY_TRANSFER_VALUE = big.NewInt(7)
var ETHEREUM_STAKE_FACTOR = big.NewInt(1000000000000000000)
var VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS = uint64(480)
var VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS = uint64(40320)
var ELECTION_PERIOD_LENGTH_IN_BLOCKS = uint64(17280)
var FIRST_ELECTION_BLOCK = uint64(7519801)
var MAX_CANDIDATE_VOTES = 3
var MAX_ELECTED_VALIDATORS = 22
var VOTE_OUT_WEIGHT_PERCENT = uint64(70)
var TRANSITION_PERIOD_LENGTH_IN_BLOCKS = uint64(1)

func _init() {
	_setElectionBlockNumber(FIRST_ELECTION_BLOCK)
}

// TODO v1 noam unsafe function
/***
 * unsafetests functions
 */
func unsafetests_setVariables(stakeFactor uint64, voteMirrorPeriod uint64, voteValidPeriod uint64, electionPeriod uint64, electedValidators uint32) {
	ETHEREUM_STAKE_FACTOR = big.NewInt(int64(stakeFactor))
	VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS = voteMirrorPeriod
	VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS = voteValidPeriod
	ELECTION_PERIOD_LENGTH_IN_BLOCKS = electionPeriod
	MAX_ELECTED_VALIDATORS = int(electedValidators)
}

func unsafetests_setElectedValidators(joinedAddresses []byte) {
	index := getNumberOfElections()
	_setElectedValidatorsAtIndex(index, joinedAddresses)
}

func unsafetests_setElectedBlockNumber(blockNumber uint64) {
	_setElectionBlockNumber(blockNumber)
}

func unsafetests_setTokenAddr(addr string) { // upgrade
	ETHEREUM_TOKEN_ADDR = addr
}

func unsafetests_setVotingAddr(addr string) { // upgrade
	ETHEREUM_VOTING_ADDR = addr
}

func unsafetests_setValidatorsAddr(addr string) { // upgrade
	ETHEREUM_VALIDATORS_ADDR = addr
}

func unsafetests_setGuardiansAddr(addr string) { // upgrade
	ETHEREUM_GUARDIANS_ADDR = addr
}

/***
 * mirroring : transfer, delegate
 */
type Transfer struct {
	From  [20]byte
	To    [20]byte
	Value *big.Int
}

func mirrorDelegationByTransfer(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Transfer{}
	eventBlockNumber, eventBlockTxIndex := ethereum.GetTransactionLog(getTokenEthereumContractAddress(), getTokenAbi(), hexEncodedEthTxHash, DELEGATION_BY_TRANSFER_NAME, e)

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
	eventBlockNumber, eventBlockTxIndex := ethereum.GetTransactionLog(getVotingEthereumContractAddress(), getVotingAbi(), hexEncodedEthTxHash, DELEGATION_NAME, e)

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

/***
 * mirroring : transfer, delegate
 */
type VoteOut struct {
	Voter [20]byte
	Nodes [][20]byte
}

func mirrorVote(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &VoteOut{}
	eventBlockNumber, eventBlockTxIndex := ethereum.GetTransactionLog(getVotingEthereumContractAddress(), getVotingAbi(), hexEncodedEthTxHash, VOTE_OUT_NAME, e)
	if len(e.Nodes) > MAX_CANDIDATE_VOTES {
		panic(fmt.Errorf("voteOut of guardian %v to %v failed since voted to too many (%d) candidate",
			e.Voter, e.Nodes, len(e.Nodes)))
	}

	electionBlockNumber := _getElectionBlockNumber()
	if eventBlockNumber > electionBlockNumber {
		panic(fmt.Errorf("voteOut of guardian %v to %v failed since it happened in block number %d which is after election date (%d), resubmit next election",
			e.Voter, e.Nodes, eventBlockNumber, electionBlockNumber))
	}
	stateBlockNumber := state.ReadUint64(_formatGuardianBlockNumberKey(e.Voter[:]))
	stateBlockTxIndex := state.ReadUint32(_formatGuardianBlockTxIndexKey(e.Voter[:]))
	if stateBlockNumber > eventBlockNumber || (stateBlockNumber == eventBlockNumber && stateBlockTxIndex > eventBlockTxIndex) {
		panic(fmt.Errorf("voteOut of guardian %v to %v with block-height %d and tx-index %d failed since already have newer block-height %d and tx-index %d",
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

var VALID_VALIDAORS_COUNT = []byte("Valid_Validators_Count")

func _getNumberOfValidValidaors() int {
	return int(state.ReadUint32(VALID_VALIDAORS_COUNT))
}

func _setNumberOfValidValidaors(numberOfValidators int) {
	state.WriteUint32(VALID_VALIDAORS_COUNT, uint32(numberOfValidators))
}

func _formatValidValidaorIterator(num int) []byte {
	return []byte(fmt.Sprintf("Valid_Validator_Address_%d", num))
}

func _getValidValidatorAtIndex(index int) [20]byte {
	return _addressSliceToArray(state.ReadBytes(_formatValidValidaorIterator(index)))
}

func _setValidValidatorAtIndex(index int, guardian []byte) {
	state.WriteBytes(_formatValidValidaorIterator(index), guardian)
}

/***
 * processing
 */
func processVoting() uint64 {
	currentBlock := ethereum.GetBlockNumber()
	if !_isAfterElectionMirroring(currentBlock) {
		panic(fmt.Sprintf("mirror period (%d) for election (%d) did not end, cannot start processing", currentBlock, _getElectionBlockNumber()))
	}

	electedValidators := _processVotingStateMachine()
	if electedValidators != nil {
		_setElectedValidators(electedValidators, _getElectionBlockNumber())
		_setElectionBlockNumber(safeuint64.Add(_getElectionBlockNumber(), ELECTION_PERIOD_LENGTH_IN_BLOCKS))
		return 1
	} else {
		return 0
	}
}

func _processVotingStateMachine() [][20]byte {
	processState := _getVotingProcessState()
	if processState == "" {
		_readValidValidatorsFromEthereumToState()
		_setVotingProcessState(VOTING_PROCESS_STATE_GUARDIANSS)
		fmt.Printf("elections %10d: moving to state %s\n", _getElectionBlockNumber(), VOTING_PROCESS_STATE_GUARDIANSS)
		return nil
	} else if processState == VOTING_PROCESS_STATE_GUARDIANSS {
		_collectNextGuardianStakeFromEthereum()
		return nil
	} else if processState == VOTING_PROCESS_STATE_DELEGATORS {
		_collectNextDelegatorStakeFromEthereum()
		return nil
	} else if processState == VOTING_PROCESS_STATE_CALCULATIONS {
		candidateVotes, totalVotes := _calculateVotes()
		elected := _processValidatorsSelection(candidateVotes, totalVotes)
		_setVotingProcessState("")
		return elected
	}
	// TODO v1 noam cleanup stage
	return nil
}

func _readValidValidatorsFromEthereumToState() {
	var validValidators [][20]byte
	ethereum.CallMethodAtBlock(_getElectionBlockNumber(), getValidatorsEthereumContractAddress(), getValidatorsAbi(), "getValidators", &validValidators)

	_setNumberOfValidValidaors(len(validValidators))
	for i := 0; i < len(validValidators); i++ {
		_setValidValidatorAtIndex(i, validValidators[i][:])
		fmt.Printf("elections %10d: from ethereum valid validator number %d :  %x\n", _getElectionBlockNumber(), i, validValidators[i])
	}
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
	ethereum.CallMethodAtBlock(_getElectionBlockNumber(), getTokenEthereumContractAddress(), getTokenAbi(), "balanceOf", stake, ethAddr)
	return ((*stake).Div(*stake, ETHEREUM_STAKE_FACTOR)).Uint64()
}

func _calculateVotes() (candidateVotes map[[20]byte]uint64, totalVotes uint64) {
	guardianStakes := _collectGuardiansStake()
	delegatorStakes := _collectDelegatorsStake(guardianStakes)
	guardianToDelegators := _findGuardianDelegators(delegatorStakes)
	candidateVotes, totalVotes = _guardiansCastVotes(guardianStakes, guardianToDelegators, delegatorStakes)
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

func _guardiansCastVotes(guardianStakes map[[20]byte]uint64, guardianDelegators map[[20]byte][][20]byte, delegatorStakes map[[20]byte]uint64) (candidateVotes map[[20]byte]uint64, totalVotes uint64) {
	totalVotes = uint64(0)
	candidateVotes = make(map[[20]byte]uint64)
	for guardian, guardianStake := range guardianStakes {
		stake := safeuint64.Add(guardianStake, _calculateOneGuardianVoteRecursive(guardian, guardianDelegators, delegatorStakes))
		totalVotes = safeuint64.Add(totalVotes, stake)
		fmt.Printf("elections %10d: guardian %x, voting stake %d\n", _getElectionBlockNumber(), guardian, stake)

		candidateList := _getCandidates(guardian[:])
		for _, candidate := range candidateList {
			fmt.Printf("elections %10d: guardian %x, voted for candidate %x\n", _getElectionBlockNumber(), guardian, candidate)
			candidateVotes[candidate] = safeuint64.Add(candidateVotes[candidate], stake)
		}
	}
	fmt.Printf("elections %10d: total voting stake %d\n", _getElectionBlockNumber(), totalVotes)
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

func _processValidatorsSelection(candidateVotes map[[20]byte]uint64, totalVotes uint64) [][20]byte {
	validValidators := _getValidValidators()
	voteOutThreshhold := safeuint64.Div(safeuint64.Mul(totalVotes, VOTE_OUT_WEIGHT_PERCENT), 100)
	fmt.Printf("elections %10d: %d is vote out threshhold\n", _getElectionBlockNumber(), voteOutThreshhold)

	winners := make([][20]byte, 0, len(validValidators))
	for _, validator := range validValidators {
		voted, ok := candidateVotes[validator]
		if !ok || voted < voteOutThreshhold {
			fmt.Printf("elections %10d: elected %x (got %d vote outs)\n", _getElectionBlockNumber(), validator, voted)
			winners = append(winners, validator)
		} else {
			fmt.Printf("elections %10d: candidate %x voted out by %d votes\n", _getElectionBlockNumber(), validator, voted)
		}
	}
	return winners
}

func _getValidValidators() (validValidtors [][20]byte) {
	numOfValidators := _getNumberOfValidValidaors()
	validValidtors = make([][20]byte, numOfValidators)
	for i := 0; i < numOfValidators; i++ {
		validValidtors[i] = _getValidValidatorAtIndex(i)
	}
	return
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

/***
 * Helpers
 */
func _addressSliceToArray(a []byte) [20]byte {
	var array [20]byte
	copy(array[:], a)
	return array
}

func _isAfterElectionMirroring(BlockNumber uint64) bool {
	return BlockNumber > _getElectionBlockNumber()+VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS
}

/*****
 * Election results
 */
func getElectedValidators() []byte {
	index := getNumberOfElections()
	return getElectedValidatorsByIndex(index)
}

func getElectedValidatorsByBlockNumber(blockNumber uint64) []byte {
	numberOfElections := getNumberOfElections()
	for i := numberOfElections; i > 0; i-- {
		if getElectedValidatorsBlockNumberByIndex(i) < blockNumber {
			return getElectedValidatorsByIndex(i)
		}
	}
	return _getDefaultElectionResults()
}

func getElectedValidatorsByBlockHeight(blockHeight uint64) []byte {
	numberOfElections := getNumberOfElections()
	for i := numberOfElections; i > 0; i-- {
		if getElectedValidatorsBlockHeightByIndex(i) < blockHeight {
			return getElectedValidatorsByIndex(i)
		}
	}
	return _getDefaultElectionResults()
}

func _setElectedValidators(elected [][20]byte) {
	electionBlockNumber := _getElectionBlockNumber()
	electedForSave := _concatElectedAddresses(elected)
	index := getNumberOfElections()
	if getElectedValidatorsBlockNumberByIndex(index) > electionBlockNumber {
		panic(fmt.Sprintf("Election results rejected as new election happend at block %d which is older than last election %d",
			electionBlockNumber, getElectedValidatorsBlockNumberByIndex(index)))
	}
	index++
	_setElectedValidatorsBlockNumberAtIndex(index, electionBlockNumber)
	_setElectedValidatorsBlockHeightAtIndex(index, env.GetBlockHeight()+TRANSITION_PERIOD_LENGTH_IN_BLOCKS)
	_setElectedValidatorsAtIndex(index, electedForSave)
	_setNumberOfElections(index)
}

func _concatElectedAddresses(elected [][20]byte) []byte {
	electedForSave := make([]byte, 0, len(elected)*20)
	for i := range elected {
		electedForSave = append(electedForSave, elected[i][:]...)
	}
	return electedForSave
}

func _getDefaultElectionResults() []byte {
	defElected := [20]byte{0x10} // TODO v1 get defaults
	return defElected[:]
}

func _formatElectionsNumber() []byte {
	return []byte("_CURRENT_ELECTION_INDEX_KEY_")
}

func getNumberOfElections() uint32 {
	return state.ReadUint32(_formatElectionsNumber())
}

func _setNumberOfElections(index uint32) {
	state.WriteUint32(_formatElectionsNumber(), index)
}

func _formatElectionBlockNumber(index uint32) []byte {
	return []byte(fmt.Sprintf("Election_%d_BlockNumber", index))
}

func getElectedValidatorsBlockNumberByIndex(index uint32) uint64 {
	return state.ReadUint64(_formatElectionBlockNumber(index))
}

func _setElectedValidatorsBlockNumberAtIndex(index uint32, blockNumber uint64) {
	state.WriteUint64(_formatElectionBlockNumber(index), blockNumber)
}

func _formatElectionBlockHeight(index uint32) []byte {
	return []byte(fmt.Sprintf("Election_%d_BlockHeight", index))
}

func getElectedValidatorsBlockHeightByIndex(index uint32) uint64 {
	return state.ReadUint64(_formatElectionBlockHeight(index))
}

func _setElectedValidatorsBlockHeightAtIndex(index uint32, blockHeight uint64) {
	state.WriteUint64(_formatElectionBlockHeight(index), blockHeight)
}

func _formatElectionValidator(index uint32) []byte {
	return []byte(fmt.Sprintf("Election_%d_Validators", index))
}

func getElectedValidatorsByIndex(index uint32) []byte {
	return state.ReadBytes(_formatElectionValidator(index))
}

func _setElectedValidatorsAtIndex(index uint32, elected []byte) {
	state.WriteBytes(_formatElectionValidator(index), elected)
}

var ELECTION_BLOCK_NUMBER = []byte("Election_Block_Number")

func _getElectionBlockNumber() uint64 {
	return state.ReadUint64(ELECTION_BLOCK_NUMBER)
}

func _setElectionBlockNumber(BlockNumber uint64) {
	state.WriteUint64(ELECTION_BLOCK_NUMBER, BlockNumber)
}

/*****
 * Connections to other contracts
 */
var ETHEREUM_TOKEN_ADDR = "0x5B31Ea29271Cc0De13E17b67a8f94Dd0b8F4B959"
var ETHEREUM_VOTING_ADDR = "0xf572dd7e283671535AF6b6F81E8a0E0772062C5b"
var ETHEREUM_VALIDATORS_ADDR = "0xb2FbE7373b059BE34BDFdF8cC6606869F4c69a95"
var ETHEREUM_GUARDIANS_ADDR = "0xb2FbE7373b059BE34BDFdF8cC6606869F4c69a95"

func getTokenEthereumContractAddress() string {
	return ETHEREUM_TOKEN_ADDR
}

func getTokenAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getGuardiansEthereumContractAddress() string {
	return ETHEREUM_GUARDIANS_ADDR
}

func getGuardiansAbi() string {
	return `[{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"name":"register","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"isGuardian","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getGuardianData","outputs":[{"name":"name","type":"string"},{"name":"website","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getRegistrationBlockHeight","outputs":[{"name":"registeredOn","type":"uint256"},{"name":"lastUpdatedOn","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"offset","type":"uint256"},{"name":"limit","type":"uint256"}],"name":"getGuardians","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getVotingEthereumContractAddress() string {
	return ETHEREUM_VOTING_ADDR
}

func getVotingAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"nodes","type":"bytes20[]"},{"indexed":false,"name":"voteCounter","type":"uint256"}],"name":"VoteOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Delegate","type":"event"},{"constant":false,"inputs":[{"name":"nodes","type":"address[]"}],"name":"voteOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getLastVote","outputs":[{"name":"nodes","type":"address[]"},{"name":"blockHeight","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getValidatorsEthereumContractAddress() string {
	return ETHEREUM_VALIDATORS_ADDR
}

func getValidatorsAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorRemoved","type":"event"},{"constant":false,"inputs":[{"name":"validator","type":"address"}],"name":"addValidator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"validator","type":"address"}],"name":"remove","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"isValidator","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getValidators","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getApprovalBockHeight","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
}
