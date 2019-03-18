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
	"sort"
)

var PUBLIC = sdk.Export(getTokenEthereumContractAddress, getGuardiansEthereumContractAddress, getVotingEthereumContractAddress, getValidatorsEthereumContractAddress, getValidatorsRegistryEthereumContractAddress,
	unsafetests_setTokenEthereumContractAddress, unsafetests_setGuardiansEthereumContractAddress,
	unsafetests_setVotingEthereumContractAddress, unsafetests_setValidatorsEthereumContractAddress, unsafetests_setValidatorsRegistryEthereumContractAddress,
	unsafetests_setVariables, unsafetests_setElectedValidators, unsafetests_setElectedBlockNumber,
	mirrorDelegationByTransfer, mirrorDelegation, mirrorVote,
	processVoting,
	getElectionPeriod, getCurrentElectionBlockNumber, getNextElectionBlockNumber, getEffectiveElectionBlockNumber, getNumberOfElections,
	getCurrentEthereumBlockNumber, getProcessingStartBlockNumber, getMirroringEndBlockNumber,
	getElectedValidatorsOrbsAddress, getElectedValidatorsEthereumAddress, getElectedValidatorsEthereumAddressByBlockNumber, getElectedValidatorsOrbsAddressByBlockHeight,
	getElectedValidatorsOrbsAddressByIndex, getElectedValidatorsEthereumAddressByIndex, getElectedValidatorsBlockNumberByIndex, getElectedValidatorsBlockHeightByIndex,
	getCumulativeParticipationReward, getCumulativeGuardianExcellenceReward, getCumulativeValidatorReward,
	getGuardianStake, getGuardianVotingWeight, getTotalStake, getValidValidatorStake, getValidValidatorVote, getExcellenceProgramGuardians,
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
var ELECTION_PERIOD_LENGTH_IN_BLOCKS = uint64(15000)
var TRANSITION_PERIOD_LENGTH_IN_BLOCKS = uint64(1)
var FIRST_ELECTION_BLOCK = uint64(7467969)
var MAX_CANDIDATE_VOTES = 3
var MAX_ELECTED_VALIDATORS = 22
var MIN_ELECTED_VALIDATORS = 7
var VOTE_OUT_WEIGHT_PERCENT = uint64(70)

func _init() {
}

// TODO v1 noam unsafe function
/***
 * unsafetests functions
 */
func unsafetests_setVariables(stakeFactor uint64, voteMirrorPeriod uint64, voteValidPeriod uint64, electionPeriod uint64, maxElectedValidators uint32, minElectedValidators uint32) {
	ETHEREUM_STAKE_FACTOR = big.NewInt(int64(stakeFactor))
	VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS = voteMirrorPeriod
	VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS = voteValidPeriod
	ELECTION_PERIOD_LENGTH_IN_BLOCKS = electionPeriod
	MAX_ELECTED_VALIDATORS = int(maxElectedValidators)
	MIN_ELECTED_VALIDATORS = int(minElectedValidators)
}

func unsafetests_setElectedValidators(joinedAddresses []byte) {
	index := getNumberOfElections()
	_setElectedValidatorsOrbsAddressAtIndex(index, joinedAddresses)
}

func unsafetests_setElectedBlockNumber(blockNumber uint64) {
	_setCurrentElectionBlockNumber(blockNumber)
}

func unsafetests_setTokenEthereumContractAddress(addr string) {
	ETHEREUM_TOKEN_ADDR = addr
}

func unsafetests_setVotingEthereumContractAddress(addr string) {
	ETHEREUM_VOTING_ADDR = addr
}

func unsafetests_setValidatorsEthereumContractAddress(addr string) {
	ETHEREUM_VALIDATORS_ADDR = addr
}

func unsafetests_setValidatorsRegistryEthereumContractAddress(addr string) {
	ETHEREUM_VALIDATORS_REGISTRY_ADDR = addr
}

func unsafetests_setGuardiansEthereumContractAddress(addr string) {
	ETHEREUM_GUARDIANS_ADDR = addr
}

/***
 * Mirror : transfer, delegate
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

func _mirrorDelegationData(delegator []byte, agent []byte, eventBlockNumber uint64, eventBlockTxIndex uint32, eventName string) {
	electionBlockNumber := _getCurrentElectionBlockNumber()
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
	emptyAddr := [20]byte{}
	if bytes.Equal(delegator, agent) {
		agent = emptyAddr[:]
	}

	state.WriteBytes(_formatDelegatorAgentKey(delegator), agent)
	state.WriteUint64(_formatDelegatorBlockNumberKey(delegator), eventBlockNumber)
	state.WriteUint32(_formatDelegatorBlockTxIndexKey(delegator), eventBlockTxIndex)
	state.WriteString(_formatDelegatorMethod(delegator), eventName)
}

/***
 * Delegators - Data struct
 */
func _formatNumberOfDelegators() []byte {
	return []byte("Delegator_Address_Count")
}

func _getNumberOfDelegators() int {
	return int(state.ReadUint32(_formatNumberOfDelegators()))
}

func _setNumberOfDelegators(numberOfDelegators int) {
	state.WriteUint32(_formatNumberOfDelegators(), uint32(numberOfDelegators))
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
 * Mirror vote
 */
type VoteOut struct {
	Voter      [20]byte
	Validators [][20]byte
}

func mirrorVote(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &VoteOut{}
	eventBlockNumber, eventBlockTxIndex := ethereum.GetTransactionLog(getVotingEthereumContractAddress(), getVotingAbi(), hexEncodedEthTxHash, VOTE_OUT_NAME, e)
	if len(e.Validators) > MAX_CANDIDATE_VOTES {
		panic(fmt.Errorf("voteOut of guardian %v to %v failed since voted to too many (%d) candidate",
			e.Voter, e.Validators, len(e.Validators)))
	}
	isGuardian := false
	ethereum.CallMethodAtBlock(eventBlockNumber, getGuardiansEthereumContractAddress(), getGuardiansAbi(), "isGuardian", &isGuardian, e.Voter)
	if !isGuardian {
		panic(fmt.Errorf("voteOut of guardian %v to %v failed since it is not a guardian at blockNumber %d",
			e.Voter, e.Validators, eventBlockNumber))
	}

	electionBlockNumber := _getCurrentElectionBlockNumber()
	if eventBlockNumber > electionBlockNumber {
		panic(fmt.Errorf("voteOut of guardian %v to %v failed since it happened in block number %d which is after election date (%d), resubmit next election",
			e.Voter, e.Validators, eventBlockNumber, electionBlockNumber))
	}
	stateBlockNumber := state.ReadUint64(_formatGuardianBlockNumberKey(e.Voter[:]))
	stateBlockTxIndex := state.ReadUint32(_formatGuardianBlockTxIndexKey(e.Voter[:]))
	if stateBlockNumber > eventBlockNumber || (stateBlockNumber == eventBlockNumber && stateBlockTxIndex > eventBlockTxIndex) {
		panic(fmt.Errorf("voteOut of guardian %v to %v with block-height %d and tx-index %d failed since already have newer block-height %d and tx-index %d",
			e.Voter, e.Validators, eventBlockNumber, eventBlockTxIndex, stateBlockNumber, stateBlockTxIndex))
	}

	if stateBlockNumber == 0 { // new guardian
		numOfGuardians := _getNumberOfGurdians()
		_setGuardianAtIndex(numOfGuardians, e.Voter[:])
		_setNumberOfGurdians(numOfGuardians + 1)
	}

	fmt.Printf("elections %10d: guardian %x voted against (%d) %v\n", _getCurrentElectionBlockNumber(), e.Voter, len(e.Validators), e.Validators)
	_setCandidates(e.Voter[:], e.Validators)
	state.WriteUint64(_formatGuardianBlockNumberKey(e.Voter[:]), eventBlockNumber)
	state.WriteUint32(_formatGuardianBlockTxIndexKey(e.Voter[:]), eventBlockTxIndex)
}

/***
 * Guardians - Data struct
 */
func _formatNumberOfGuardians() []byte {
	return []byte("Guardian_Address_Count")
}

func _getNumberOfGurdians() int {
	return int(state.ReadUint32(_formatNumberOfGuardians()))
}

func _setNumberOfGurdians(numberOfGuardians int) {
	state.WriteUint32(_formatNumberOfGuardians(), uint32(numberOfGuardians))
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

func getGuardianStake(guardian []byte) uint64 {
	return state.ReadUint64(_formatGuardianStakeKey(guardian))
}

func _setGuardianStake(guardian []byte, stake uint64) {
	state.WriteUint64(_formatGuardianStakeKey(guardian), stake)
}

func _formatGuardianVoteWeightKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_%s_Weight", hex.EncodeToString(guardian)))
}

func getGuardianVotingWeight(guardian []byte) uint64 {
	return state.ReadUint64(_formatGuardianVoteWeightKey(guardian))
}

func _setGuardianVotingWeight(guardian []byte, weight uint64) {
	state.WriteUint64(_formatGuardianVoteWeightKey(guardian), weight)
}

/***
 * Valid Validators
 */
func _setValidValidators(validValidators [][20]byte) {
	_setNumberOfValidValidaors(len(validValidators))
	for i := 0; i < len(validValidators); i++ {
		_setValidValidatorEthereumAddressAtIndex(i, validValidators[i][:])
	}
}

func _getValidValidators() (validValidtors [][20]byte) {
	numOfValidators := _getNumberOfValidValidaors()
	validValidtors = make([][20]byte, numOfValidators)
	for i := 0; i < numOfValidators; i++ {
		validValidtors[i] = _getValidValidatorEthereumAddressAtIndex(i)
	}
	return
}

/***
 * Valid Validators - data struct
 */
func _formatNumberOfValidators() []byte {
	return []byte("Valid_Validators_Count")
}

func _getNumberOfValidValidaors() int {
	return int(state.ReadUint32(_formatNumberOfValidators()))
}

func _setNumberOfValidValidaors(numberOfValidators int) {
	state.WriteUint32(_formatNumberOfValidators(), uint32(numberOfValidators))
}

func _formatValidValidaorIterator(num int) []byte {
	return []byte(fmt.Sprintf("Valid_Validator_Address_%d", num))
}

func _getValidValidatorEthereumAddressAtIndex(index int) [20]byte {
	return _addressSliceToArray(state.ReadBytes(_formatValidValidaorIterator(index)))
}

func _setValidValidatorEthereumAddressAtIndex(index int, guardian []byte) {
	state.WriteBytes(_formatValidValidaorIterator(index), guardian)
}

func _formatValidValidatorOrbsAddressKey(validator []byte) []byte {
	return []byte(fmt.Sprintf("Valid_Validator_%s_Orbs", hex.EncodeToString(validator)))
}

func _getValidValidatorOrbsAddress(validator []byte) [20]byte {
	return _addressSliceToArray(state.ReadBytes(_formatValidValidatorOrbsAddressKey(validator)))
}

func _setValidValidatorOrbsAddress(validator []byte, orbsAddress []byte) {
	state.WriteBytes(_formatValidValidatorOrbsAddressKey(validator), orbsAddress)
}

func _formatValidValidatorStakeKey(validator []byte) []byte {
	return []byte(fmt.Sprintf("Valid_Validator_%s_Stake", hex.EncodeToString(validator)))
}

func getValidValidatorStake(validator []byte) uint64 {
	return state.ReadUint64(_formatValidValidatorStakeKey(validator))
}

func _setValidValidatorStake(validator []byte, stake uint64) {
	state.WriteUint64(_formatValidValidatorStakeKey(validator), stake)
}

func _formatValidValidatorVoteKey(validator []byte) []byte {
	return []byte(fmt.Sprintf("Valid_Validator_%s_Vote", hex.EncodeToString(validator)))
}

func getValidValidatorVote(validator []byte) uint64 {
	return state.ReadUint64(_formatValidValidatorVoteKey(validator))
}

func _setValidValidatorVote(validator []byte, stake uint64) {
	state.WriteUint64(_formatValidValidatorVoteKey(validator), stake)
}

/***
 * processing
 */
func processVoting() uint64 {
	currentBlock := ethereum.GetBlockNumber()
	if !_isAfterElectionMirroring(currentBlock) {
		panic(fmt.Sprintf("mirror period (%d - %d) did not end (now %d). cannot start processing", _getCurrentElectionBlockNumber(), _getCurrentElectionBlockNumber()+VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS, currentBlock))
	}

	electedValidators := _processVotingStateMachine()
	if electedValidators != nil {
		_setElectedValidators(electedValidators)
		_setCurrentElectionBlockNumber(safeuint64.Add(_getCurrentElectionBlockNumber(), ELECTION_PERIOD_LENGTH_IN_BLOCKS))
		return 1
	} else {
		return 0
	}
}

func _processVotingStateMachine() [][20]byte {
	processState := _getVotingProcessState()
	if processState == "" {
		_readValidValidatorsFromEthereumToState()
		_nextProcessVotingState(VOTING_PROCESS_STATE_VALIDATORS)
		return nil
	} else if processState == VOTING_PROCESS_STATE_VALIDATORS {
		if _collectNextValidatorDataFromEthereum() {
			_nextProcessVotingState(VOTING_PROCESS_STATE_GUARDIANS)
		}
		return nil
	} else if processState == VOTING_PROCESS_STATE_GUARDIANS {
		if _collectNextGuardianStakeFromEthereum() {
			_nextProcessVotingState(VOTING_PROCESS_STATE_DELEGATORS)
		}
		return nil
	} else if processState == VOTING_PROCESS_STATE_DELEGATORS {
		if _collectNextDelegatorStakeFromEthereum() {
			_nextProcessVotingState(VOTING_PROCESS_STATE_CALCULATIONS)
		}
		return nil
	} else if processState == VOTING_PROCESS_STATE_CALCULATIONS {
		candidateVotes, totalVotes, participantStakes, guardiansAccumulatedStake := _calculateVotes()
		elected := _processValidatorsSelection(candidateVotes, totalVotes)
		_processRewards(totalVotes, elected, participantStakes, guardiansAccumulatedStake)
		_setVotingProcessState("")
		return elected
	}
	return nil
}

func _nextProcessVotingState(stage string) {
	_setVotingProcessItem(0)
	_setVotingProcessState(stage)
	fmt.Printf("elections %10d: moving to state %s\n", _getCurrentElectionBlockNumber(), stage)
}

func _readValidValidatorsFromEthereumToState() {
	var validValidators [][20]byte
	ethereum.CallMethodAtBlock(_getCurrentElectionBlockNumber(), getValidatorsEthereumContractAddress(), getValidatorsAbi(), "getValidators", &validValidators)

	_setValidValidators(validValidators)
}

func _collectNextValidatorDataFromEthereum() (isDone bool) {
	nextIndex := _getVotingProcessItem()
	_collectOneValidatorDataFromEthereum(nextIndex)
	nextIndex++
	_setVotingProcessItem(nextIndex)
	return nextIndex >= _getNumberOfValidValidaors()
}

func _collectOneValidatorDataFromEthereum(i int) {
	validator := _getValidValidatorEthereumAddressAtIndex(i)

	var orbsAddress [20]byte
	ethereum.CallMethodAtBlock(_getCurrentElectionBlockNumber(), getValidatorsRegistryEthereumContractAddress(), getValidatorsRegistryAbi(), "getOrbsAddress", &orbsAddress, validator)
	stake := _getStakeAtElection(validator)

	_setValidValidatorStake(validator[:], stake)
	_setValidValidatorOrbsAddress(validator[:], orbsAddress[:])
	fmt.Printf("elections %10d: from ethereumBlockNumber Validator %x, stake %d orbsAddress %x\n", _getCurrentElectionBlockNumber(), validator, stake, orbsAddress)
}

func _collectNextGuardianStakeFromEthereum() bool {
	nextIndex := _getVotingProcessItem()
	_collectOneGuardianStakeFromEthereum(nextIndex)
	nextIndex++
	_setVotingProcessItem(nextIndex)
	return nextIndex >= _getNumberOfGurdians()
}

func _collectOneGuardianStakeFromEthereum(i int) {
	guardian := _getGuardianAtIndex(i)
	stake := uint64(0)
	voteBlockNumber := state.ReadUint64(_formatGuardianBlockNumberKey(guardian[:]))
	if voteBlockNumber != 0 && safeuint64.Add(voteBlockNumber, VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS) > _getCurrentElectionBlockNumber() {
		isGuardian := false
		ethereum.CallMethodAtBlock(_getCurrentElectionBlockNumber(), getGuardiansEthereumContractAddress(), getGuardiansAbi(), "isGuardian", &isGuardian, guardian)
		if isGuardian {
			stake = _getStakeAtElection(guardian)
		}
	}
	_setGuardianStake(guardian[:], stake)
	fmt.Printf("elections %10d: from ethereumBlockNumber guardian %x, stake %d\n", _getCurrentElectionBlockNumber(), guardian, stake)
}

func _collectNextDelegatorStakeFromEthereum() bool {
	nextIndex := _getVotingProcessItem()
	_collectOneDelegatorStakeFromEthereum(nextIndex)
	nextIndex++
	_setVotingProcessItem(nextIndex)
	return nextIndex >= _getNumberOfDelegators()
}

func _collectOneDelegatorStakeFromEthereum(i int) {
	delegator := _getDelegatorAtIndex(i)
	stake := _getStakeAtElection(delegator)
	state.WriteUint64(_formatDelegatorStakeKey(delegator[:]), stake)
	fmt.Printf("elections %10d: from ethereumBlockNumber delegator %x , stake %d\n", _getCurrentElectionBlockNumber(), delegator, stake)
}

func _getStakeAtElection(ethAddr [20]byte) uint64 {
	stake := new(*big.Int)
	ethereum.CallMethodAtBlock(_getCurrentElectionBlockNumber(), getTokenEthereumContractAddress(), getTokenAbi(), "balanceOf", stake, ethAddr)
	return ((*stake).Div(*stake, ETHEREUM_STAKE_FACTOR)).Uint64()
}

func _calculateVotes() (candidateVotes map[[20]byte]uint64, totalVotes uint64, participantStakes map[[20]byte]uint64, guardianAccumulatedStakes map[[20]byte]uint64) {
	guardianStakes := _collectGuardiansStake()
	delegatorStakes := _collectDelegatorsStake(guardianStakes)
	guardianToDelegators := _findGuardianDelegators(delegatorStakes)
	candidateVotes, totalVotes, participantStakes, guardianAccumulatedStakes = _guardiansCastVotes(guardianStakes, guardianToDelegators, delegatorStakes)
	return
}

func _collectGuardiansStake() (guardianStakes map[[20]byte]uint64) {
	guardianStakes = make(map[[20]byte]uint64)
	numOfGuardians := _getNumberOfGurdians()
	for i := 0; i < numOfGuardians; i++ {
		guardian := _getGuardianAtIndex(i)
		voteBlockNumber := state.ReadUint64(_formatGuardianBlockNumberKey(guardian[:]))
		if voteBlockNumber != 0 && safeuint64.Add(voteBlockNumber, VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS) > _getCurrentElectionBlockNumber() {
			stake := getGuardianStake(guardian[:])
			guardianStakes[guardian] = stake
			fmt.Printf("elections %10d: guardian %x, stake %d\n", _getCurrentElectionBlockNumber(), guardian, stake)
		} else {
			fmt.Printf("elections %10d: guardian %x voted at %d is too old, ignoring as guardian \n", _getCurrentElectionBlockNumber(), guardian, voteBlockNumber)
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
			fmt.Printf("elections %10d: delegator %x, stake %d\n", _getCurrentElectionBlockNumber(), delegator, stake)
		} else {
			fmt.Printf("elections %10d: delegator %x ignored as it is also a guardian\n", _getCurrentElectionBlockNumber(), delegator)
		}
	}
	return
}

func _findGuardianDelegators(delegatorStakes map[[20]byte]uint64) (guardianToDelegators map[[20]byte][][20]byte) {
	guardianToDelegators = make(map[[20]byte][][20]byte)

	for delegator := range delegatorStakes {
		guardian := _getDelegatorGuardian(delegator[:])
		if !bytes.Equal(guardian[:], delegator[:]) {
			fmt.Printf("elections %10d: delegator %x, guardian/agent %x\n", _getCurrentElectionBlockNumber(), delegator, guardian)
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

func _guardiansCastVotes(guardianStakes map[[20]byte]uint64, guardianDelegators map[[20]byte][][20]byte, delegatorStakes map[[20]byte]uint64) (candidateVotes map[[20]byte]uint64, totalVotes uint64, participantStakes map[[20]byte]uint64, guardainsAccumulatedStakes map[[20]byte]uint64) {
	totalVotes = uint64(0)
	candidateVotes = make(map[[20]byte]uint64)
	participantStakes = make(map[[20]byte]uint64)
	guardainsAccumulatedStakes = make(map[[20]byte]uint64)
	for guardian, guardianStake := range guardianStakes {
		participantStakes[guardian] = guardianStake
		fmt.Printf("elections %10d: guardian %x, self-voting stake %d\n", _getCurrentElectionBlockNumber(), guardian, guardianStake)
		stake := safeuint64.Add(guardianStake, _calculateOneGuardianVoteRecursive(guardian, guardianDelegators, delegatorStakes, participantStakes))
		guardainsAccumulatedStakes[guardian] = stake
		_setGuardianVotingWeight(guardian[:], stake)
		totalVotes = safeuint64.Add(totalVotes, stake)
		fmt.Printf("elections %10d: guardian %x, voting stake %d\n", _getCurrentElectionBlockNumber(), guardian, stake)

		candidateList := _getCandidates(guardian[:])
		for _, candidate := range candidateList {
			fmt.Printf("elections %10d: guardian %x, voted for candidate %x\n", _getCurrentElectionBlockNumber(), guardian, candidate)
			candidateVotes[candidate] = safeuint64.Add(candidateVotes[candidate], stake)
		}
	}
	fmt.Printf("elections %10d: total voting stake %d\n", _getCurrentElectionBlockNumber(), totalVotes)
	_setTotalStake(totalVotes)
	return
}

// Note : important that first call is to guardian ... otherwise not all delegators will be added to participants
func _calculateOneGuardianVoteRecursive(currentLevelGuardian [20]byte, guardianToDelegators map[[20]byte][][20]byte, delegatorStakes map[[20]byte]uint64, participantStakes map[[20]byte]uint64) uint64 {
	guardianDelegatorList, ok := guardianToDelegators[currentLevelGuardian]
	currentVotes := delegatorStakes[currentLevelGuardian]
	if ok {
		for _, delegate := range guardianDelegatorList {
			participantStakes[delegate] = delegatorStakes[delegate]
			currentVotes = safeuint64.Add(currentVotes, _calculateOneGuardianVoteRecursive(delegate, guardianToDelegators, delegatorStakes, participantStakes))
		}
	}
	return currentVotes
}

func _processValidatorsSelection(candidateVotes map[[20]byte]uint64, totalVotes uint64) [][20]byte {
	validValidators := _getValidValidators()
	voteOutThreshhold := safeuint64.Div(safeuint64.Mul(totalVotes, VOTE_OUT_WEIGHT_PERCENT), 100)
	fmt.Printf("elections %10d: %d is vote out threshhold\n", _getCurrentElectionBlockNumber(), voteOutThreshhold)

	winners := make([][20]byte, 0, len(validValidators))
	for _, validator := range validValidators {
		voted, ok := candidateVotes[validator]
		_setValidValidatorVote(validator[:], voted)
		if !ok || voted < voteOutThreshhold {
			fmt.Printf("elections %10d: elected %x (got %d vote outs)\n", _getCurrentElectionBlockNumber(), validator, voted)
			winners = append(winners, validator)
		} else {
			fmt.Printf("elections %10d: candidate %x voted out by %d votes\n", _getCurrentElectionBlockNumber(), validator, voted)
		}
	}
	if len(winners) < MIN_ELECTED_VALIDATORS {
		fmt.Printf("elections %10d: not enought validators left after vote using all valid validators %v\n", _getCurrentElectionBlockNumber(), validValidators)
		return validValidators
	} else {
		return winners
	}
}

func _formatTotalVotingStakeKey() []byte {
	return []byte("Total_Voting_Weight")
}

func getTotalStake() uint64 {
	return state.ReadUint64(_formatTotalVotingStakeKey())
}

func _setTotalStake(weight uint64) {
	state.WriteUint64(_formatTotalVotingStakeKey(), weight)
}

const VOTING_PROCESS_STATE_VALIDATORS = "validators"
const VOTING_PROCESS_STATE_DELEGATORS = "delegators"
const VOTING_PROCESS_STATE_GUARDIANS = "guardians"
const VOTING_PROCESS_STATE_CALCULATIONS = "calculations"
const VOTING_PROCESS_STATE_CLEANUP = "cleanUp"

func _formatVotingProcessStateKey() []byte {
	return []byte("Voting_Process_State")
}

func _getVotingProcessState() string {
	return state.ReadString(_formatVotingProcessStateKey())
}

func _setVotingProcessState(name string) {
	state.WriteString(_formatVotingProcessStateKey(), name)
}

func _formatVotingProcessItemIteratorKey() []byte {
	return []byte("Voting_Process_Item")
}

func _getVotingProcessItem() int {
	return int(state.ReadUint32(_formatVotingProcessItemIteratorKey()))
}

func _setVotingProcessItem(i int) {
	state.WriteUint32(_formatVotingProcessItemIteratorKey(), uint32(i))
}

/***
 * Rewards
 */
var ELECTION_PARTICIPATION_MAX_REWARD = uint64(493150) // 60M / number of elections per year
var ELECTION_PARTICIPATION_MAX_STAKE_REWARD_PERCENT = uint64(8)
var ELECTION_GUARDIAN_EXCELLENCE_MAX_REWARD = uint64(328767) // 40M / number of elections per year
var ELECTION_GUARDIAN_EXCELLENCE_MAX_STAKE_REWARD_PERCENT = uint64(10)
var ELECTION_GUARDIAN_EXCELLENCE_MAX_NUMBER = 10
var ELECTION_VALIDATOR_INTRODUCTION_MAX_REWARD = uint64(8220) // 1M / number of elections per year
var ELECTION_VALIDATOR_MAX_STAKE_REWARD_PERCENT = uint64(4)

func _getValidatorsStake() (validatorsStake map[[20]byte]uint64) {
	validatorsStake = make(map[[20]byte]uint64)
	numOfValidators := _getNumberOfValidValidaors()
	for i := 0; i < numOfValidators; i++ {
		validator := _getValidValidatorEthereumAddressAtIndex(i)
		stake := getValidValidatorStake(validator[:])
		validatorsStake[validator] = stake
		fmt.Printf("elections %10d rewards: validator %x, stake %d\n", _getCurrentElectionBlockNumber(), validator, stake)
	}
	return
}

func _processRewards(totalVotes uint64, elected [][20]byte, participantStakes map[[20]byte]uint64, guardiansAccumulatedStake map[[20]byte]uint64) {
	_processRewardsParticipants(totalVotes, participantStakes)
	_processRewardsGuardians(totalVotes, guardiansAccumulatedStake)
	validatorsStake := _getValidatorsStake()
	_processRewardsValidators(validatorsStake)
}

func _processRewardsParticipants(totalVotes uint64, participantStakes map[[20]byte]uint64) {
	totalReward := _maxRewardForGroup(ELECTION_PARTICIPATION_MAX_REWARD, totalVotes, ELECTION_PARTICIPATION_MAX_STAKE_REWARD_PERCENT)
	fmt.Printf("elections %10d rewards: participants total reward is %d \n", _getCurrentElectionBlockNumber(), totalReward)
	for participant, stake := range participantStakes {
		reward := safeuint64.Div(safeuint64.Mul(stake, totalReward), totalVotes)
		fmt.Printf("elections %10d rewards: participant %x, stake %d adding %d\n", _getCurrentElectionBlockNumber(), participant, stake, reward)
		_addCumulativeParticipationReward(participant[:], reward)
	}
}

func _processRewardsGuardians(totalVotes uint64, guardiansAccumulatedStake map[[20]byte]uint64) {
	if len(guardiansAccumulatedStake) > ELECTION_GUARDIAN_EXCELLENCE_MAX_NUMBER {
		fmt.Printf("elections %10d rewards: there are %d guardians with total reward is %d - choosing %d top guardians\n",
			_getCurrentElectionBlockNumber(), len(guardiansAccumulatedStake), totalVotes, ELECTION_GUARDIAN_EXCELLENCE_MAX_NUMBER)
		guardiansAccumulatedStake, totalVotes = _getTopGuardians(guardiansAccumulatedStake)
		fmt.Printf("elections %10d rewards: top %d guardians with total vote is now %d \n", _getCurrentElectionBlockNumber(), len(guardiansAccumulatedStake), totalVotes)
	}

	_setExcellenceProgramGuardians(guardiansAccumulatedStake)
	totalReward := _maxRewardForGroup(ELECTION_GUARDIAN_EXCELLENCE_MAX_REWARD, totalVotes, ELECTION_GUARDIAN_EXCELLENCE_MAX_STAKE_REWARD_PERCENT)
	fmt.Printf("elections %10d rewards: guardians total reward is %d \n", _getCurrentElectionBlockNumber(), totalReward)
	for guardian, stake := range guardiansAccumulatedStake {
		reward := safeuint64.Div(safeuint64.Mul(stake, totalReward), totalVotes)
		fmt.Printf("elections %10d rewards: guardian %x, stake %d adding %d\n", _getCurrentElectionBlockNumber(), guardian, stake, reward)
		_addCumulativeGuardianExcellenceReward(guardian[:], reward)
	}
}

func _processRewardsValidators(validatorStakes map[[20]byte]uint64) {
	for validator, stake := range validatorStakes {
		reward := safeuint64.Add(ELECTION_VALIDATOR_INTRODUCTION_MAX_REWARD, safeuint64.Div(safeuint64.Mul(stake, ELECTION_VALIDATOR_MAX_STAKE_REWARD_PERCENT), 100))
		fmt.Printf("elections %10d rewards: validator %x, stake %d adding %d\n", _getCurrentElectionBlockNumber(), validator, stake, reward)
		_addCumulativeValidatorReward(validator[:], reward)
	}
}

func _maxRewardForGroup(upperMaximum, totalVotes, percent uint64) uint64 {
	calcMaximum := safeuint64.Div(safeuint64.Mul(totalVotes, percent), 100)
	fmt.Printf("elections %10d rewards: uppperMax %d vs. %d = totalVotes %d * percent %d\n", _getCurrentElectionBlockNumber(), upperMaximum, calcMaximum, totalVotes, percent)
	if calcMaximum < upperMaximum {
		return calcMaximum
	}
	return upperMaximum
}

func _formatCumulativeParticipationReward(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Participant_CumReward_%s", hex.EncodeToString(delegator)))
}

func getCumulativeParticipationReward(delegator []byte) uint64 {
	return state.ReadUint64(_formatCumulativeParticipationReward(delegator))
}

func _addCumulativeParticipationReward(delegator []byte, reward uint64) {
	_addCumulativeReward(_formatCumulativeParticipationReward(delegator), reward)
}

func _formatCumulativeGuardianExcellenceReward(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_CumReward_%s", hex.EncodeToString(guardian)))
}

func getCumulativeGuardianExcellenceReward(guardian []byte) uint64 {
	return state.ReadUint64(_formatCumulativeGuardianExcellenceReward(guardian))
}

func _addCumulativeGuardianExcellenceReward(guardian []byte, reward uint64) {
	_addCumulativeReward(_formatCumulativeGuardianExcellenceReward(guardian), reward)
}

func _formatCumulativeValidatorReward(validator []byte) []byte {
	return []byte(fmt.Sprintf("Vaidator_CumReward_%s", hex.EncodeToString(validator)))
}

func getCumulativeValidatorReward(validator []byte) uint64 {
	return state.ReadUint64(_formatCumulativeValidatorReward(validator))
}

func _addCumulativeValidatorReward(validator []byte, reward uint64) {
	_addCumulativeReward(_formatCumulativeValidatorReward(validator), reward)
}

func _addCumulativeReward(key []byte, reward uint64) {
	sumReward := safeuint64.Add(state.ReadUint64(key), reward)
	state.WriteUint64(key, sumReward)
}

func _formatExcellenceProgramGuardians() []byte {
	return []byte("Excellence_Program_Guardians")
}

func getExcellenceProgramGuardians() []byte {
	return state.ReadBytes(_formatExcellenceProgramGuardians())
}

func _setExcellenceProgramGuardians(guardians map[[20]byte]uint64) {
	guardiansForSave := make([]byte, 0, len(guardians)*20)
	for guardianAddr := range guardians {
		guardiansForSave = append(guardiansForSave, guardianAddr[:]...)
	}
	state.WriteBytes(_formatExcellenceProgramGuardians(), guardiansForSave)
}

/***
 * Rewards: Sort top guardians using sort.Interface
 */
func _getTopGuardians(guardiansAccumulatedStake map[[20]byte]uint64) (topGuardiansStake map[[20]byte]uint64, totalVotes uint64) {
	totalVotes = uint64(0)
	topGuardiansStake = make(map[[20]byte]uint64)

	guardianList := make(guardianArray, 0, len(guardiansAccumulatedStake))
	for guardian, vote := range guardiansAccumulatedStake {
		guardianList = append(guardianList, &guardianVote{guardian, vote})
	}
	sort.Sort(guardianList)

	for i := 0; i < ELECTION_GUARDIAN_EXCELLENCE_MAX_NUMBER; i++ {
		fmt.Printf("elections %10d rewards: top guardian %x, has %d votes\n", _getCurrentElectionBlockNumber(), guardianList[i].guardian, guardianList[i].vote)
		totalVotes = safeuint64.Add(totalVotes, guardianList[i].vote)
		topGuardiansStake[guardianList[i].guardian] = guardianList[i].vote
	}
	return
}

type guardianVote struct {
	guardian [20]byte
	vote     uint64
}
type guardianArray []*guardianVote

func (s guardianArray) Len() int {
	return len(s)
}

func (s guardianArray) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s guardianArray) Less(i, j int) bool {
	return s[i].vote > s[j].vote
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
	return BlockNumber > safeuint64.Add(_getCurrentElectionBlockNumber(), VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS)
}

func _mirrorPeriodValidator() {
	currentBlock := ethereum.GetBlockNumber()
	if _getVotingProcessState() != "" && _isAfterElectionMirroring(currentBlock) {
		panic(fmt.Errorf("current block number (%d) indicates mirror period for election (%d) has ended, resubmit next election", currentBlock, _getCurrentElectionBlockNumber()))
	}
}

/*****
 * Election results
 */
func getElectionPeriod() uint64 {
	return ELECTION_PERIOD_LENGTH_IN_BLOCKS
}

func getElectedValidatorsOrbsAddress() []byte {
	index := getNumberOfElections()
	return getElectedValidatorsOrbsAddressByIndex(index)
}

func getElectedValidatorsEthereumAddress() []byte {
	index := getNumberOfElections()
	return getElectedValidatorsEthereumAddressByIndex(index)
}

func getElectedValidatorsEthereumAddressByBlockNumber(blockNumber uint64) []byte {
	numberOfElections := getNumberOfElections()
	for i := numberOfElections; i > 0; i-- {
		if getElectedValidatorsBlockNumberByIndex(i) < blockNumber {
			return getElectedValidatorsEthereumAddressByIndex(i)
		}
	}
	return _getDefaultElectionResults()
}

func getElectedValidatorsOrbsAddressByBlockHeight(blockHeight uint64) []byte {
	numberOfElections := getNumberOfElections()
	for i := numberOfElections; i > 0; i-- {
		if getElectedValidatorsBlockHeightByIndex(i) < blockHeight {
			return getElectedValidatorsOrbsAddressByIndex(i)
		}
	}
	return _getDefaultElectionResults()
}

func _setElectedValidators(elected [][20]byte) {
	electionBlockNumber := _getCurrentElectionBlockNumber()
	index := getNumberOfElections()
	if getElectedValidatorsBlockNumberByIndex(index) > electionBlockNumber {
		panic(fmt.Sprintf("Election results rejected as new election happend at block %d which is older than last election %d",
			electionBlockNumber, getElectedValidatorsBlockNumberByIndex(index)))
	}
	index++
	_setElectedValidatorsBlockNumberAtIndex(index, electionBlockNumber)
	_setElectedValidatorsBlockHeightAtIndex(index, env.GetBlockHeight()+TRANSITION_PERIOD_LENGTH_IN_BLOCKS)
	electedOrbsAddresses := _translateElectedAddressesToOrbsAddressesAndConcat(elected)
	_setElectedValidatorsOrbsAddressAtIndex(index, electedOrbsAddresses)
	electedEthereumAddresses := _concatElectedEthereumAddresses(elected)
	_setElectedValidatorsEthereumAddressAtIndex(index, electedEthereumAddresses)
	_setNumberOfElections(index)
}

func _concatElectedEthereumAddresses(elected [][20]byte) []byte {
	electedForSave := make([]byte, 0, len(elected)*20)
	for _, addr := range elected {
		electedForSave = append(electedForSave, addr[:]...)
	}
	return electedForSave
}

func _translateElectedAddressesToOrbsAddressesAndConcat(elected [][20]byte) []byte {
	electedForSave := make([]byte, 0, len(elected)*20)
	for i := range elected {
		electedOrbsAddress := _getValidValidatorOrbsAddress(elected[i][:])
		fmt.Printf("elections %10d: translate %x to %x\n", _getCurrentElectionBlockNumber(), elected[i][:], electedOrbsAddress)
		electedForSave = append(electedForSave, electedOrbsAddress[:]...)
	}
	return electedForSave
}

func initCurrentElectionBlockNumber() {
	if getCurrentElectionBlockNumber() == 0 {
		currBlock := getCurrentEthereumBlockNumber()
		if currBlock < FIRST_ELECTION_BLOCK {
			_setCurrentElectionBlockNumber(FIRST_ELECTION_BLOCK)
		} else {
			blocksSinceFirstEver := safeuint64.Sub(currBlock, FIRST_ELECTION_BLOCK)
			blocksSinceStartOfAnElection := safeuint64.Mod(blocksSinceFirstEver, getElectionPeriod())
			blocksUntilNextElection := safeuint64.Sub(getElectionPeriod(), blocksSinceStartOfAnElection)
			nextElectionBlock := safeuint64.Add(currBlock, blocksUntilNextElection)
			_setCurrentElectionBlockNumber(nextElectionBlock)
		}
	}
}

func _getDefaultElectionResults() []byte {
	return []byte{}
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

func _formatElectionValidatorEtheretumAddress(index uint32) []byte {
	return []byte(fmt.Sprintf("Election_%d_ValidatorsEth", index))
}

func getElectedValidatorsEthereumAddressByIndex(index uint32) []byte {
	return state.ReadBytes(_formatElectionValidatorEtheretumAddress(index))
}

func _setElectedValidatorsEthereumAddressAtIndex(index uint32, elected []byte) {
	state.WriteBytes(_formatElectionValidatorEtheretumAddress(index), elected)
}

func _formatElectionValidatorOrbsAddress(index uint32) []byte {
	return []byte(fmt.Sprintf("Election_%d_ValidatorsOrbs", index))
}

func getElectedValidatorsOrbsAddressByIndex(index uint32) []byte {
	return state.ReadBytes(_formatElectionValidatorOrbsAddress(index))
}

func _setElectedValidatorsOrbsAddressAtIndex(index uint32, elected []byte) {
	state.WriteBytes(_formatElectionValidatorOrbsAddress(index), elected)
}

func getEffectiveElectionBlockNumber() uint64 {
	return getElectedValidatorsBlockNumberByIndex(getNumberOfElections())
}

func _formatElectionBlockNumberKey() []byte {
	return []byte("Election_Block_Number")
}

func _getCurrentElectionBlockNumber() uint64 {
	initCurrentElectionBlockNumber()
	return getCurrentElectionBlockNumber()
}

func _setCurrentElectionBlockNumber(BlockNumber uint64) {
	state.WriteUint64(_formatElectionBlockNumberKey(), BlockNumber)
}

func getCurrentElectionBlockNumber() uint64 {
	return state.ReadUint64(_formatElectionBlockNumberKey())
}

func getNextElectionBlockNumber() uint64 {
	return safeuint64.Add(_getCurrentElectionBlockNumber(), getElectionPeriod())
}

func getCurrentEthereumBlockNumber() uint64 {
	return ethereum.GetBlockNumber()
}

func getProcessingStartBlockNumber() uint64 {
	return _getCurrentElectionBlockNumber() + VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS
}

func getMirroringEndBlockNumber() uint64 {
	return _getCurrentElectionBlockNumber() + VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS
}

/*****
 * Connections to Ethereum contracts
 */
var ETHEREUM_TOKEN_ADDR = "0x9ebeE932c50d342E9b7eF53BB9011dc88d087EA5"
var ETHEREUM_VOTING_ADDR = "0xed4EDddE2E3C2a44c92Ef6a1ae9Ca507916AA614"
var ETHEREUM_VALIDATORS_ADDR = "0x6a8fA3Af98Db5FBe30d41d73510Ee5499254199f"
var ETHEREUM_VALIDATORS_REGISTRY_ADDR = "0xB2d154c83581751404bDb063D17E7A79D9A55C07"
var ETHEREUM_GUARDIANS_ADDR = "0x71FB398f1959Fd75D5862A37B3315A6D761569BA"

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
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"validators","type":"bytes20[]"},{"indexed":false,"name":"voteCounter","type":"uint256"}],"name":"VoteOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegationCounter","type":"uint256"}],"name":"Delegate","type":"event"},{"constant":false,"inputs":[{"name":"validators","type":"address[]"}],"name":"voteOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"guardian","type":"address"}],"name":"getLastVote","outputs":[{"name":"validators","type":"address[]"},{"name":"blockHeight","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getValidatorsEthereumContractAddress() string {
	return ETHEREUM_VALIDATORS_ADDR
}

func getValidatorsAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorRemoved","type":"event"},{"constant":false,"inputs":[{"name":"validator","type":"address"}],"name":"addValidator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"validator","type":"address"}],"name":"remove","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"isValidator","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getValidators","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getApprovalBockHeight","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
}

func getValidatorsRegistryEthereumContractAddress() string {
	return ETHEREUM_VALIDATORS_REGISTRY_ADDR
}

func getValidatorsRegistryAbi() string {
	return `[{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorLeft","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorRegistered","type":"event"},{"constant":false,"inputs":[{"name":"name","type":"string"},{"name":"ipAddress","type":"bytes"},{"name":"website","type":"string"},{"name":"orbsAddress","type":"bytes20"}],"name":"register","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getValidatorData","outputs":[{"name":"name","type":"string"},{"name":"ipAddress","type":"bytes"},{"name":"website","type":"string"},{"name":"orbsAddress","type":"bytes20"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getRegistrationBlockHeight","outputs":[{"name":"registeredOn","type":"uint256"},{"name":"lastUpdatedOn","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"isValidator","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"validator","type":"address"}],"name":"getOrbsAddress","outputs":[{"name":"orbsAddress","type":"bytes20"}],"payable":false,"stateMutability":"view","type":"function"}]`
}
