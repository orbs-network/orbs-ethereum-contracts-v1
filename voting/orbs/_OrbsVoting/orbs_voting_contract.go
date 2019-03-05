package main

import (
	"encoding/hex"
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/ethereum"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/safemath/safeuint64"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/service"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	"math/big"
)

var PUBLIC = sdk.Export(getTokenAddr, setTokenAddr, getTokenAbi, getVotingAddr, setVotingAddr, getVotingAbi, getValidatorsAddr, setValidatorsAddr, getValidatorsAbi,
	getOrbsConfigContract,
	mirrorDelegationByTransfer, mirrorDelegation, mirrorVote,
	getVoteData, getDelegationData, // TODO v1 todo noam temp - i think remove completet
	_getDelegatorStake, // todo v1 todo noam remove from public
	processVoting,
	setFirstElectionBlockHeight)
var SYSTEM = sdk.Export(_init, setTokenAbi, setVotingAbi, setValidatorsAbi, setOrbsValidatorsConfigContract /* TODO v1 security run once */)

//var EVENTS = sdk.Export(OrbsTransferredOut)

// defaults other contracts
const defaultOrbsValidatorsConfigContract = "OrbsValidatorsConfig"
const defaultTokenAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
const defaultTokenAddr = "0xC5515Ba056eb0515FDd2207bCCbf3beE2a6d4749"
const defaultVotingAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"nodes","type":"bytes20[]"},{"indexed":false,"name":"vote_counter","type":"uint256"}],"name":"Vote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"delegator","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegation_counter","type":"uint256"}],"name":"Delegate","type":"event"},{"constant":false,"inputs":[{"name":"nodes","type":"address[]"}],"name":"vote","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]`
const defaultVotingAddr = "0x32a2095CE3CE64bE16645FADbF331D2dd43f9574"
const defaultValidatorsAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorRemoved","type":"event"},{"constant":false,"inputs":[{"name":"_validator","type":"address"}],"name":"addValidator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"m","type":"address"}],"name":"isValidator","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getValidators","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"}]`
const defaultValidatorsAddr = "0x5a1D39bBA3D36C4d8796aB711264853574cEF149"

// parameters
var DELEGATION_NAME = "Delegate"
var DELEGATION_BY_TRANSFER_NAME = "Transfer"
var DELEGATION_BY_TRANSFER_VALUE = big.NewInt(7)

var ETHEREUM_STAKE_FACTOR = big.NewInt(1000000000000000000)

var VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS = uint64(3)  // TODO NOAM TODO v1 600
var VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS = uint64(500) // TODO NOAM TODO v1 50000
var ELECTION_PERIOD_LENGTH_IN_BLOCKS = uint64(200)   // TODO NOAM TODO v1 20000

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

type Transfer struct {
	From  [20]byte
	To    [20]byte
	Value *big.Int
}

func mirrorDelegationByTransfer(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Transfer{}
	eventBlockHeight, eventBlockTxIndex := ethereum.GetTransactionLog(getTokenAddr(), getTokenAbi(), hexEncodedEthTxHash, DELEGATION_BY_TRANSFER_NAME, e)

	if DELEGATION_BY_TRANSFER_VALUE.Cmp(e.Value) != 0 {
		panic(fmt.Errorf("mirrorDelegateByTransfer from %v to %v failed since %d is wrong delegation value", e.From, e.To, e.Value.Uint64()))
	}

	_mirrorDelegationData(e.From[:], e.To[:], eventBlockHeight, eventBlockTxIndex, DELEGATION_BY_TRANSFER_NAME)
}

type Delegate struct {
	Delegator [20]byte
	To        [20]byte
}

func mirrorDelegation(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Delegate{}
	eventBlockHeight, eventBlockTxIndex := ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, DELEGATION_NAME, e)

	_mirrorDelegationData(e.Delegator[:], e.To[:], eventBlockHeight, eventBlockTxIndex, DELEGATION_NAME)
}

func _mirrorPeriodValidator() {
	currentBlock := ethereum.GetBlockNumber()
	if _isAfterElectionMirroring(currentBlock) {
		panic(fmt.Errorf("current block number (%d) indicates mirror period for election (%d) has ended, resubmit next election", currentBlock, _getElectionBlockHeight()))
	}
}

func _mirrorDelegationData(delegator []byte, agent []byte, eventBlockHeight uint64, eventBlockTxIndex uint32, eventName string) {
	electionBlockHeight := _getElectionBlockHeight()
	if eventBlockHeight > electionBlockHeight {
		panic(fmt.Errorf("delegate with medthod %s from %v to %v failed since it happened in block number %d which is after election date (%d), resubmit next election",
			eventName, delegator, agent, eventBlockHeight, electionBlockHeight))
	}
	stateMethod := state.ReadString(_formatDelegatorMethod(delegator))
	stateBlockHeight := uint64(0)
	if stateMethod == DELEGATION_NAME && eventName == DELEGATION_BY_TRANSFER_NAME {
		panic(fmt.Errorf("delegate with medthod %s from %v to %v failed since already have delegation with method %s",
			eventName, delegator, agent, stateMethod))
	} else if stateMethod == eventName {
		stateBlockHeight = state.ReadUint64(_formatDelegatorBlockHeightKey(delegator))
		stateBlockTxIndex := state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegator))
		if stateBlockHeight > eventBlockHeight || (stateBlockHeight == eventBlockHeight && stateBlockTxIndex > eventBlockTxIndex) {
			panic(fmt.Errorf("delegate from %v to %v with block-height %d and tx-index %d failed since already have newer block-height %d and tx-index %d",
				delegator, agent, eventBlockHeight, eventBlockTxIndex, stateBlockHeight, stateBlockTxIndex))
		}
	}

	if stateBlockHeight == 0 { // new delegator
		numOfDelegators := _getNumberOfDelegators()
		_setDelegatorAtIndex(numOfDelegators, delegator)
		_setNumberOfDelegators(numOfDelegators + 1)
	}

	state.WriteBytes(_formatDelegatorAgentKey(delegator), agent)
	state.WriteUint64(_formatDelegatorBlockHeightKey(delegator), eventBlockHeight)
	state.WriteUint32(_formatDelegatorBlockTxIndexKey(delegator), eventBlockTxIndex)
	state.WriteString(_formatDelegatorMethod(delegator), eventName)
}

func getDelegationData(delegator []byte) (addr []byte, blockNumber uint64, txIndex uint32, method string) {
	return state.ReadBytes(_formatDelegatorAgentKey(delegator)),
		state.ReadUint64(_formatDelegatorBlockHeightKey(delegator)),
		state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegator)),
		state.ReadString(_formatDelegatorMethod(delegator))
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
	return []byte(fmt.Sprintf("StakeHolder_%s_Agent", hex.EncodeToString(delegator)))
}

func _formatDelegatorBlockHeightKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("StakeHolder_%s_BlockHeight", hex.EncodeToString(delegator)))
}

func _formatDelegatorBlockTxIndexKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("StakeHolder_%s_BlockTxIndex", hex.EncodeToString(delegator)))
}

func _formatDelegatorMethod(delegator []byte) []byte {
	return []byte(fmt.Sprintf("StakeHolder_%s_Method", hex.EncodeToString(delegator)))
}

func _formatDelegatorStakeKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("StakeHolder_%s_Stake", hex.EncodeToString(delegator)))
}

type Vote struct {
	Voter      [20]byte
	Nodes [][20]byte
}

func mirrorVote(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Vote{}
	eventBlockHeight, eventBlockTxIndex := ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, "Vote", e)
	electionBlockHeight := _getElectionBlockHeight()
	if eventBlockHeight > electionBlockHeight {
		panic(fmt.Errorf("vote of guardian %v to %v failed since it happened in block number %d which is after election date (%d), resubmit next election",
			e.Voter, e.Nodes, eventBlockHeight, electionBlockHeight))
	}
	stateBlockHeight := state.ReadUint64(_formatGuardianBlockHeightKey(e.Voter[:]))
	stateBlockTxIndex := state.ReadUint32(_formatGuardianBlockTxIndexKey(e.Voter[:]))
	if stateBlockHeight > eventBlockHeight || (stateBlockHeight == eventBlockHeight && stateBlockTxIndex > eventBlockTxIndex) {
		panic(fmt.Errorf("vote of guardian %v to %v with block-height %d and tx-index %d failed since already have newer block-height %d and tx-index %d",
			e.Voter, e.Nodes, eventBlockHeight, eventBlockTxIndex, stateBlockHeight, stateBlockTxIndex))
	}

	if stateBlockHeight == 0 { // new guardian
		numOfGuardians := _getNumberOfGurdians()
		_setGuardianAtIndex(numOfGuardians, e.Voter[:])
		_setNumberOfGurdians(numOfGuardians + 1)
	}

	// TODO noam due-diligent guardian missing

	_setCandidates(e.Voter[:], e.Nodes)
	state.WriteUint64(_formatGuardianBlockHeightKey(e.Voter[:]), eventBlockHeight)
	state.WriteUint32(_formatGuardianBlockTxIndexKey(e.Voter[:]), eventBlockTxIndex)
}

func getVoteData(guardian []byte) (addr []byte, blockNumber uint64, txIndex uint32) {
	return state.ReadBytes(_formatGuardianCandidateKey(guardian)),
		state.ReadUint64(_formatGuardianBlockHeightKey(guardian)),
		state.ReadUint32(_formatGuardianBlockTxIndexKey(guardian))
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

func _formatGuardianBlockHeightKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Guardian_%s_BlockHeight", hex.EncodeToString(guardian)))
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
		panic(fmt.Sprintf("mirror period (%d) for election (%d) did not end, cannot start processing", currentBlock, _getElectionBlockHeight()))
	}

	electedValidators := processVotingInternal(currentBlock)
	if electedValidators != nil {
		_updateElected(electedValidators)
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
	service.CallMethod(getOrbsConfigContract(), "updateElectionResults", electedForSave)
}

func processVotingInternal(blockNumber uint64) [][20]byte {
	processState := _getVotingProcessState()
	if processState == "" {
		_setVotingProcessState(VOTING_PROCESS_STATE_GUARDIANSS)
		fmt.Printf("moving to state %s (read guardians from ethereum)\n", VOTING_PROCESS_STATE_GUARDIANSS)
	}

	if processState == VOTING_PROCESS_STATE_GUARDIANSS {
		_collectNextGuardianStakeFromEthereum(blockNumber)
		return nil
	} else if processState == VOTING_PROCESS_STATE_DELEGATORS {
		_collectNextDelegatorStakeFromEthereum(blockNumber)
		return nil
	} else if processState == VOTING_PROCESS_STATE_CALCULATIONS {
		elected := _calculateVotes(blockNumber)
		_setVotingProcessState("")
		return elected
	}
	// TODO NoaM ToDO v1 cleanup
	return nil
}

func _collectNextGuardianStakeFromEthereum(blockNumber uint64) {
	nextIndex := _getVotingProcessItem()
	_collectOneGuardianStakeFromEthereum(blockNumber, nextIndex)
	nextIndex++
	if nextIndex >= _getNumberOfGurdians() {
		_setVotingProcessItem(0)
		_setVotingProcessState(VOTING_PROCESS_STATE_DELEGATORS)
		fmt.Printf("moving to state %s (read delegators from ethereum)\n", VOTING_PROCESS_STATE_DELEGATORS)
	} else {
		_setVotingProcessItem(nextIndex)
	}
}

func _collectOneGuardianStakeFromEthereum(blockNumber uint64, i int) {
	guardian := _getGuardianAtIndex(i)
	stake := _getDelegatorStake(guardian[:], blockNumber)
	state.WriteUint64(_formatGuardianStakeKey(guardian[:]), stake)
	fmt.Printf("noam : guardian %x , stake %d \n", guardian, stake)
}

func _collectNextDelegatorStakeFromEthereum(blockNumber uint64) {
	nextIndex := _getVotingProcessItem()
	_collectOneDelegatorStakeFromEthereum(blockNumber, nextIndex)
	nextIndex++
	if nextIndex >= _getNumberOfDelegators() {
		_setVotingProcessItem(0)
		_setVotingProcessState(VOTING_PROCESS_STATE_CALCULATIONS)
		fmt.Printf("moving to state %s \n", VOTING_PROCESS_STATE_CALCULATIONS)
	} else {
		_setVotingProcessItem(nextIndex)
	}
}

func _collectOneDelegatorStakeFromEthereum(blockNumber uint64, i int) {
	delegator := _getDelegatorAtIndex(i)
	stake := _getDelegatorStake(delegator[:], blockNumber)
	state.WriteUint64(_formatDelegatorStakeKey(delegator[:]), stake)
	fmt.Printf("noam : user %x , stake %d \n", delegator, stake)
}

func _calculateVotes(blockNumber uint64) [][20]byte {
	guardianStakes := make(map[[20]byte]uint64)
	delegatorStakes := make(map[[20]byte]uint64)
	guardianToDelegators := make(map[[20]byte][][20]byte)

	_collectGuardiansStake(guardianStakes)

	_collectDelegatorsStake(delegatorStakes, guardianStakes)

	_findGuardianDelegators(delegatorStakes, guardianToDelegators)

	candidateVotes := make(map[[20]byte]uint64)
	_aggregateAllVotes(guardianStakes, guardianToDelegators, delegatorStakes, candidateVotes)

	var validValidators [][20]byte
	ethereum.CallMethodAtBlock(blockNumber, getValidatorsAddr(), getValidatorsAbi(), "getValidators", &validValidators)
	validateCandidateVotes := _filterValidaElectedValidators(candidateVotes, validValidators)

	return _getTopElectedValidators(validateCandidateVotes)
}

func _collectGuardiansStake(guardianStakes map[[20]byte]uint64) {
	numOfGuardians := _getNumberOfGurdians()
	for i := 0; i < numOfGuardians; i++ {
		guardian := _getGuardianAtIndex(i)
		voteBlockNumer := state.ReadUint64(_formatGuardianBlockHeightKey(guardian[:]))
		if voteBlockNumer > safeuint64.Sub(_getElectionBlockHeight(), VOTE_VALID_PERIOD_LENGTH_IN_BLOCKS) {
			stake := state.ReadUint64(_formatGuardianStakeKey(guardian[:]))
			guardianStakes[guardian] = stake
			fmt.Printf("noam : guardian %x , stake %d \n", guardian, stake)
		} else {
			fmt.Printf("noam : guardian %x voted at %d is too old, ignoring as guardian \n", guardian, voteBlockNumer)
		}
	}
}

func _collectDelegatorsStake(delegatorStakes map[[20]byte]uint64, guardianStakes map[[20]byte]uint64) {
	numOfDelegators := _getNumberOfDelegators()
	fmt.Printf("noam : %d delegators\n", numOfDelegators)
	for i := 0; i < numOfDelegators; i++ {
		delegator := _getDelegatorAtIndex(i)
		if _, ok := guardianStakes[delegator]; !ok {
			stake := state.ReadUint64(_formatDelegatorStakeKey(delegator[:]))
			delegatorStakes[delegator] = stake
			fmt.Printf("noam : user %x , stake %d \n", delegator, stake)
		} else {
			fmt.Printf("noam : delegatio %x ignored as it is also a guardian \n", delegator)
		}
	}
}

func _findGuardianDelegators(delegatorStakes map[[20]byte]uint64, guardianDelegators map[[20]byte][][20]byte) {
	for delegator := range delegatorStakes {
		guardian := _getDelegatorGuardian(delegator[:])
		fmt.Printf("noam : user %x, guardian %x \n", delegator, guardian)

		guardianDelegatorList, ok := guardianDelegators[guardian]
		if !ok {
			guardianDelegatorList = [][20]byte{}
		}
		guardianDelegatorList = append(guardianDelegatorList, delegator)
		guardianDelegators[guardian] = guardianDelegatorList
	}
}

func _aggregateAllVotes(guardianStakes map[[20]byte]uint64, guardianDelegators map[[20]byte][][20]byte, delegatorStakes map[[20]byte]uint64, votes map[[20]byte]uint64) {
	numOfGuardians := _getNumberOfGurdians()
	for i := 0; i < numOfGuardians; i++ {
		guardian := _getGuardianAtIndex(i)
		stake := safeuint64.Add(guardianStakes[guardian], _aggregateVotesOneGuardianRecursive(guardian, guardianDelegators, delegatorStakes))
		fmt.Printf("noam : guardian %x , stake after %d\n", guardian, stake)

		candidateList := _getCandidates(guardian[:])
		for i, candidate := range candidateList {
			fmt.Printf("noam : guardian  %x , voted for candidate %d %x\n", guardian, i, candidate)
			votes[candidate] = votes[candidate] + stake
		}
	}
}

func _aggregateVotesOneGuardianRecursive(currentLevelGuardian [20]byte, guardianDelegators map[[20]byte][][20]byte, delegatorStakes map[[20]byte]uint64) uint64 {
	guardianDelegatorList, ok := guardianDelegators[currentLevelGuardian]
	currentVotes := delegatorStakes[currentLevelGuardian]
	if ok {
		for _, delegate := range guardianDelegatorList {
			// TODO check loop to self delegation
			currentVotes = safeuint64.Add(currentVotes, _aggregateVotesOneGuardianRecursive(delegate, guardianDelegators, delegatorStakes))
		}
	}
	return currentVotes
}

func _filterValidaElectedValidators(candidateVotes map[[20]byte]uint64, validValidators [][20]byte) map[[20]byte]uint64 {
	validCandidateVotes := make(map[[20]byte]uint64)
	for _, validValidator := range validValidators {
		if validCandidateVote, ok := candidateVotes[validValidator]; ok {
			validCandidateVotes[validValidator] = validCandidateVote
		}
	}
	return validCandidateVotes
}

func _getTopElectedValidators(candidateVotes map[[20]byte]uint64) [][20]byte {
	electedValidators := newTopElected(ELECTED_VALIDATORS)
	for validator, votes := range candidateVotes {
		fmt.Printf("noam : candidate  %x , got %d votes\n", validator, votes)
		electedValidators._push(validator, votes)
	}
	fmt.Printf("noam : winners  %v\n", electedValidators.items)

	return electedValidators.items

}

var VOTING_PROCESS_STATE_KEY = []byte("Voting_Process_State")
var VOTING_PROCESS_STATE_ITERATOR_LOCATION_KEY = []byte("Voting_Process_State_Itr")

const VOTING_PROCESS_STATE_DELEGATORS = "StakeHolders"
const VOTING_PROCESS_STATE_GUARDIANSS = "Guardians"
const VOTING_PROCESS_STATE_CALCULATIONS = "Calculations"
const VOTING_PROCESS_STATE_CLEANUP = "CleanUp"

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

func _getDelegatorStake(ethAddr []byte, blockNumber uint64) uint64 {
	stake := new(*big.Int)

	//stake := big.NewInt(0)
	var addr [20]byte
	copy(addr[:], ethAddr)
	ethereum.CallMethodAtBlock(blockNumber, getTokenAddr(), getTokenAbi(), "balanceOf", stake, addr)

	return (*stake).Uint64()
}

/*****
 * timings
 */
var ELECTION_BLOCK_NUMBER = []byte("Election_Block_Number")

func _getElectionBlockHeight() uint64 {
	return state.ReadUint64(ELECTION_BLOCK_NUMBER)
}

func _setElectionBlockHeight(blockHeight uint64) {
	state.WriteUint64(ELECTION_BLOCK_NUMBER, blockHeight)
}

func setFirstElectionBlockHeight(blockHeight uint64) {
	//if _getElectionBlockHeight() == 0 { TODO NOam todo v1 remove comment and/or change way of doing it
	state.WriteUint64(ELECTION_BLOCK_NUMBER, blockHeight)
	//}
}

func _isAfterElectionMirroring(blockHeight uint64) bool {
	return blockHeight > _getElectionBlockHeight()+VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS
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
 * Sort top elected
 */
// TODO NOAM TODO v1 unit test this.
type topElected struct {
	items    [][20]byte
	values   []uint64
	maxSize  int
	currSize int
}

func newTopElected(maxSize int) *topElected {
	return &topElected{items: make([][20]byte, maxSize), values: make([]uint64, maxSize), maxSize: maxSize}
}

func (te *topElected) _push(newItem [20]byte, newValue uint64) {
	pos := -1
	for i := 0; i < te.currSize; i++ {
		if te.values[i] < newValue {
			pos = i
			break
		}
	}
	if pos == -1 {
		if te.currSize < te.maxSize {
			te.items[te.currSize] = newItem
			te.values[te.currSize] = newValue
			te.currSize++
		}
	} else {
		startPos := te.maxSize - 1
		if te.currSize < te.maxSize {
			te.currSize++
			startPos = te.currSize - 1
		}
		for i := startPos; i > pos; i-- {
			te.items[i] = te.items[i-1]
			te.values[i] = te.values[i-1]
		}
		te.items[pos] = newItem
		te.values[pos] = newValue
	}
}

/*****
 * Connections to other contracts - TODO v1 is this temp ?
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
