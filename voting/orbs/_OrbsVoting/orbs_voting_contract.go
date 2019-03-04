package main

import (
	"encoding/hex"
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/ethereum"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/service"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	"math/big"
)

var PUBLIC = sdk.Export(getTokenAddr, setTokenAddr, getTokenAbi, getVotingAddr, setVotingAddr, getVotingAbi, getValidatorsAddr, setValidatorsAddr, getValidatorsAbi,
	getOrbsConfigContract,
	mirrorDelegationByTransfer, mirrorDelegation, mirrorVote,
	getVoteData, getDelegationData, setVoteData, // TODO v1 todo noam temp - i think remove completet
	_getDelegatorStake, // todo v1 todo noam remove from public
	processVoting,
	setFirstElectionBlockHeight)
var SYSTEM = sdk.Export(_init, setTokenAbi, setVotingAbi, setValidatorsAbi, setOrbsValidatorsConfigContract /* TODO v1 security run once */)

//var EVENTS = sdk.Export(OrbsTransferredOut)

// defaults other contracts
const defaultOrbsValidatorsConfigContract = "OrbsValidatorsConfig"
const defaultTokenAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]`
const defaultTokenAddr = "0xC5515Ba056eb0515FDd2207bCCbf3beE2a6d4749"
const defaultVotingAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"nodes_list","type":"bytes20[]"},{"indexed":false,"name":"vote_counter","type":"uint256"}],"name":"Vote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegation_counter","type":"uint256"}],"name":"Delegate","type":"event"},{"constant":false,"inputs":[{"name":"nodes_list","type":"address[]"}],"name":"vote","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]`
const defaultVotingAddr = "0x316B0251873f8c3A3dF4CE09030aB22EFafea211"
const defaultValidatorsAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorLeft","type":"event"},{"constant":false,"inputs":[{"name":"_validator","type":"address"}],"name":"addValidator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"m","type":"address"}],"name":"isValidator","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getValidators","outputs":[{"name":"","type":"bytes20[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]`
const defaultValidatorsAddr = "0x607117B536d803EA4f600569E5014c1CeE5a74D9"

// parameters
var DELEGATION_NAME = "Delegate"
var DELEGATION_BY_TRANSFER_NAME = "Transfer"
var DELEGATION_BY_TRANSFER_VALUE = big.NewInt(7)
var VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS = uint64(3) // 600

var ELECTED_VALIDATORS = 5

// state keys
var ORBS_CONFIG_CONTRACT_KEY = []byte("_TOKEN_CONTRACT_KEY_")
var TOKEN_ETH_ADDR_KEY = []byte("_TOKEN_ETH_ADDR_KEY_")
var TOKEN_ABI_KEY = []byte("_TOKEN_ABI_KEY_")
var VOTING_ETH_ADDR_KEY = []byte("_VOTING_ETH_ADDR_KEY_")
var VOTING_ABI_KEY = []byte("_VOTING_ABI_KEY_")
var VALIDATORS_ETH_ADDR_KEY = []byte("_VALIDATORS_ETH_ADDR_KEY_")
var VALIDATORS_ABI_KEY = []byte("_VALIDATORS_ABI_KEY_")

var ELECTION_BLOCK_HEIGHT = []byte("Election_Block_Height")

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
	Stakeholder [20]byte
	To          [20]byte
}

func mirrorDelegation(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Delegate{}
	eventBlockHeight, eventBlockTxIndex := ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, DELEGATION_NAME, e)

	_mirrorDelegationData(e.Stakeholder[:], e.To[:], eventBlockHeight, eventBlockTxIndex, DELEGATION_NAME)
}

func _mirrorPeriodValidator() {
	currentBlock := ethereum.GetBlockNumber()
	if _isAfterElectionMirroring(currentBlock) {
		panic("mirror period for election ended, resubmit next election")
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
		state.WriteBytes(_formatDelegatorIterator(numOfDelegators), delegator)
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

func _getNumberOfDelegators() uint32 {
	return state.ReadUint32(DELEGATOR_COUNT)
}

func _setNumberOfDelegators(numberOfDelegators uint32) {
	state.WriteUint32(DELEGATOR_COUNT, numberOfDelegators)
}

func _formatDelegatorIterator(num uint32) []byte {
	return []byte(fmt.Sprintf("Delegator_Address_%d", num))
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

type Vote struct {
	Voter      [20]byte
	Nodes_list [][20]byte
}

func mirrorVote(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Vote{}
	eventBlockHeight, eventBlockTxIndex := ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, "Vote", e)
	electionBlockHeight := _getElectionBlockHeight()
	if eventBlockHeight > electionBlockHeight {
		panic(fmt.Errorf("vote of activist %v to %v failed since it happened in block number %d which is after election date (%d), resubmit next election",
			e.Voter, e.Nodes_list, eventBlockHeight, electionBlockHeight))
	}
	stateBlockHeight := state.ReadUint64(_formatActivistBlockHeightKey(e.Voter[:]))
	stateBlockTxIndex := state.ReadUint32(_formatActivistBlockTxIndexKey(e.Voter[:]))
	if stateBlockHeight > eventBlockHeight || (stateBlockHeight == eventBlockHeight && stateBlockTxIndex > eventBlockTxIndex) {
		panic(fmt.Errorf("vote of activist %v to %v with block-height %d and tx-index %d failed since already have newer block-height %d and tx-index %d",
			e.Voter, e.Nodes_list, eventBlockHeight, eventBlockTxIndex, stateBlockHeight, stateBlockTxIndex))
	}

	if stateBlockHeight == 0 { // new guardian
		numOfGuardians := _getNumberOfGurdians()
		state.WriteBytes(_formatGuardianIterator(numOfGuardians), e.Voter[:])
		_setNumberOfGurdians(numOfGuardians + 1)
	}

	// TODO noam due-diligent activist missing

	_setCandidates(e.Voter[:], e.Nodes_list)
	state.WriteUint64(_formatActivistBlockHeightKey(e.Voter[:]), eventBlockHeight)
	state.WriteUint32(_formatActivistBlockTxIndexKey(e.Voter[:]), eventBlockTxIndex)
}

func getVoteData(activist []byte) (addr []byte, blockNumber uint64, txIndex uint32) {
	return state.ReadBytes(_formatActivistCandidateKey(activist)),
		state.ReadUint64(_formatActivistBlockHeightKey(activist)),
		state.ReadUint32(_formatActivistBlockTxIndexKey(activist))
}
func setVoteData(activist []byte, blockNumber uint64, txIndex uint32, candidates []byte) {
	state.WriteUint64(_formatActivistBlockHeightKey(activist), blockNumber)
	state.WriteUint32(_formatActivistBlockTxIndexKey(activist), txIndex)
	state.WriteBytes(_formatActivistCandidateKey(activist), candidates)
}

var GUARDIAN_COUNT = []byte("Guardian_Address_Count")

func _getNumberOfGurdians() uint32 {
	return state.ReadUint32(GUARDIAN_COUNT)
}

func _setNumberOfGurdians(numberOfGuardians uint32) {
	state.WriteUint32(GUARDIAN_COUNT, numberOfGuardians)
}

func _formatGuardianIterator(num uint32) []byte {
	return []byte(fmt.Sprintf("Guardian_Address_%d", num))
}

func _formatActivistCandidateKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Activist_%s_Candidates", hex.EncodeToString(guardian)))
}

func _getCandidates(guardian []byte) [][20]byte {
	candidates := state.ReadBytes(_formatActivistCandidateKey(guardian))
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

	state.WriteBytes(_formatActivistCandidateKey(guardian), candidates)
}

func _formatActivistBlockHeightKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Activist_%s_BlockHeight", hex.EncodeToString(guardian)))
}

func _formatActivistBlockTxIndexKey(guardian []byte) []byte {
	return []byte(fmt.Sprintf("Activist_%s_BlockTxIndex", hex.EncodeToString(guardian)))
}

func processVoting() uint64 {
	currentBlock := ethereum.GetBlockNumber()
	if !_isAfterElectionMirroring(currentBlock) {
		panic(fmt.Sprintf("mirror period (%d) for election (%d) did not end, cannot start processing", currentBlock, _getElectionBlockHeight()))
	}

	_updateElected(processVotingInternal(currentBlock))

	return 1
}

func processVotingInternal(blockNumber uint64) [][20]byte {
	var allValidators [][20]byte
	ethereum.CallMethodAtBlock(blockNumber, getValidatorsAddr(), getValidatorsAbi(), "getValidators", &allValidators)

	delegatorStakes := make(map[[20]byte]uint64)
	guardianDelegators := make(map[[20]byte][][20]byte)
	numOfDelegators := _getNumberOfDelegators()
	fmt.Printf("noam : %d delegators\n", numOfDelegators)
	for i := uint32(0); i < numOfDelegators; i++ {
		d := state.ReadBytes(_formatDelegatorIterator(i))
		stake := _getDelegatorStake(d, blockNumber)
		var delegator [20]byte
		copy(delegator[:], d)
		delegatorStakes[delegator] = stake
		g := state.ReadBytes(_formatDelegatorAgentKey(d))
		fmt.Printf("noam : user %x , stake %d, guardian %x \n", delegator, stake, g)

		var guardian [20]byte
		copy(guardian[:], g)
		guardianDelegatorList, ok := guardianDelegators[guardian]
		if !ok {
			guardianDelegatorList = [][20]byte{}
		}
		guardianDelegatorList = append(guardianDelegatorList, delegator)
		guardianDelegators[guardian] = guardianDelegatorList
	}
	//fmt.Printf("noam : %v map\n", guardianDelegators)

	validatorsVoted := make(map[[20]byte]uint64)
	numOfGuardians := _getNumberOfGurdians()
	for i := uint32(0); i < numOfGuardians; i++ {
		guardian := state.ReadBytes(_formatGuardianIterator(i))
		stake := _getDelegatorStake(guardian, blockNumber)
		fmt.Printf("noam : guardian %x , stake %d %x \n", guardian, stake)
		var guardianAddr [20]byte
		copy(guardianAddr[:], guardian)
		guardianDelegatorList, ok := guardianDelegators[guardianAddr]
		if ok {
			for _, delegate := range guardianDelegatorList {
				stake += delegatorStakes[delegate]
			}
		}
		fmt.Printf("noam : guardian %x , stake after %d\n", guardian, stake)

		candidateList := _getCandidates(guardian)
		for i, candidate := range candidateList {
			fmt.Printf("noam : guardian  %x , voted for candidate %d %x\n", guardian, i, candidate)
			validatorsVoted[candidate] = validatorsVoted[candidate] + stake
		}
	}
	fmt.Printf("noam : %v guardians\n", validatorsVoted)

	electedValidators := newTopElected(validatorsVoted, ELECTED_VALIDATORS)
	for validator := range validatorsVoted {
		electedValidators._push(validator)
	}
	//numOfElected := len(validatorsVoted)
	//electedValidators := make([][20]byte, 0, numOfElected)
	//for validator := range validatorsVoted {
	//	electedValidators = append(electedValidators, validator)
	//}

	return electedValidators.topItems
}

func _updateElected(elected [][20]byte) {
	electedForSave := make([]byte, 0, len(elected)*20)
	for i := range elected {
		electedForSave = append(electedForSave, elected[i][:]...)
	}
	service.CallMethod(getOrbsConfigContract(), "updateElectionResults", electedForSave)
}

// TODO NOAM TODO v1 unit test this.
type topElected struct {
	base     map[[20]byte]uint64
	topItems [][20]byte
	maxSize  int
	currSize int
}

func newTopElected(voted map[[20]byte]uint64, maxSize int) *topElected {
	return &topElected{base: voted, topItems: make([][20]byte, maxSize), maxSize: maxSize}
}
func (te *topElected) _push(newItem [20]byte) {
	pos := -1
	for i := 0; i < te.currSize; i++ {
		if te.base[te.topItems[i]] < te.base[newItem] {
			pos = i
			break
		}
	}
	if pos == -1 {
		if te.currSize < te.maxSize {
			te.topItems[te.currSize] = newItem
			te.currSize++
		}
	} else {
		for i := te.currSize - 1; i > pos; i-- {
			te.topItems[i] = te.topItems[i-1]
		}
		te.topItems[pos] = newItem
	}
}

var VOTING_PROCESS_STATE_KEY = []byte("Voting_Process_State")

const VOTING_PROCESS_STATE_STAKEHOLDERS = "StakeHolders"
const VOTING_PROCESS_STATE_ACTIVISTS = "Activists"
const VOTING_PROCESS_STATE_CALCULATIONS = "Calculations"
const VOTING_PROCESS_STATE_CLEANUP = "CleanUp"

func _getVotingProcessState() string {
	return state.ReadString(VOTING_PROCESS_STATE_KEY)
}

func _setVotingProcessState(name string) {
	state.WriteString(VOTING_PROCESS_STATE_KEY, name)
}

var VOTING_PROCESS_ITEM_KEY = []byte("Voting_Process_Item")

func _getVotingProcessItem() uint32 {
	return state.ReadUint32(VOTING_PROCESS_ITEM_KEY)
}

func _setVotingProcessItem(name uint32) {
	state.WriteUint32(VOTING_PROCESS_ITEM_KEY, name)
}

func _getDelegatorStake(ethAddr []byte, blockNumber uint64) uint64 {
	stake := new(*big.Int)

	//stake := big.NewInt(0)
	var addr [20]byte
	copy(addr[:], ethAddr)
	ethereum.CallMethodAtBlock(blockNumber, getTokenAddr(), getTokenAbi(), "balanceOf", stake, addr)
	return (*stake).Uint64()
}

func setWinners() {

}

/*****
 * timings
 */
func _getElectionBlockHeight() uint64 {
	return state.ReadUint64(ELECTION_BLOCK_HEIGHT)
}

func _setElectionBlockHeight(blockHeight uint64) {
	state.WriteUint64(ELECTION_BLOCK_HEIGHT, blockHeight)
}

func setFirstElectionBlockHeight(blockHeight uint64) {
	//if _getElectionBlockHeight() == 0 { TODO NOam todo v1 remove comment and/or change way of doing it
	state.WriteUint64(ELECTION_BLOCK_HEIGHT, blockHeight)
	//}
}

func _isAfterElectionMirroring(blockHeight uint64) bool {
	return blockHeight > _getElectionBlockHeight()+VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS
}

/*****
 * Connections to other contracts - TODO v1 is this temp ?
 */
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
