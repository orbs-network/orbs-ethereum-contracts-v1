package main

import (
	"encoding/hex"
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/ethereum"
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
const defaultVotingAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"voter","type":"address"},{"indexed":false,"name":"nodeslist","type":"address[]"},{"indexed":false,"name":"vote_counter","type":"uint256"}],"name":"Vote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"delegation_counter","type":"uint256"}],"name":"Delegate","type":"event"},{"constant":false,"inputs":[{"name":"nodes_list","type":"address[]"}],"name":"vote","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]`
const defaultVotingAddr = "0xE1623DFC79Fe86FB966F5784E4196406E02469fE"
const defaultValidatorsAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"validator","type":"address"}],"name":"ValidatorLeft","type":"event"},{"constant":false,"inputs":[{"name":"_validator","type":"address"}],"name":"addValidator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"m","type":"address"}],"name":"isValidator","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getValidators","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"leave","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]`
const defaultValidatorsAddr = "0xE1623DFC79Fe86FB966F5784E4196406E02469fC"

// parameters
var DELEGATION_NAME = "Delegate"
var DELEGATION_BY_TRANSFER_NAME = "Transfer"
var DELEGATION_BY_TRANSFER_VALUE = big.NewInt(7)
var VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS = uint64(500)

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
	if stateMethod == DELEGATION_NAME && eventName == DELEGATION_BY_TRANSFER_NAME {
		panic(fmt.Errorf("delegate with medthod %s from %v to %v failed since already have delegation with method %s",
			eventName, delegator, agent, stateMethod))
	} else if stateMethod == eventName {
		stateBlockHeight := state.ReadUint64(_formatDelegatorBlockHeightKey(delegator))
		stateBlockTxIndex := state.ReadUint32(_formatDelegatorBlockTxIndexKey(delegator))
		if stateBlockHeight > eventBlockHeight || (stateBlockHeight == eventBlockHeight && stateBlockTxIndex > eventBlockTxIndex) {
			panic(fmt.Errorf("delegate from %v to %v with block-height %d and tx-index %d failed since already have newer block-height %d and tx-index %d",
				delegator, agent, eventBlockHeight, eventBlockTxIndex, stateBlockHeight, stateBlockTxIndex))
		}
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
	Voter     [20]byte
	Nodeslist [][20]byte
}

func mirrorVote(hexEncodedEthTxHash string) {
	_mirrorPeriodValidator()
	e := &Vote{}
	eventBlockHeight, eventBlockTxIndex := ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, "Vote", e)
	electionBlockHeight := _getElectionBlockHeight()
	if eventBlockHeight > electionBlockHeight {
		panic(fmt.Errorf("vote of activist %v to %v failed since it happened in block number %d which is after election date (%d), resubmit next election",
			e.Voter, e.Nodeslist, eventBlockHeight, electionBlockHeight))
	}
	stateBlockHeight := state.ReadUint64(_formatActivistBlockHeightKey(e.Voter[:]))
	stateBlockTxIndex := state.ReadUint32(_formatActivistBlockTxIndexKey(e.Voter[:]))
	if stateBlockHeight > eventBlockHeight || (stateBlockHeight == eventBlockHeight && stateBlockTxIndex > eventBlockTxIndex) {
		panic(fmt.Errorf("vote of activist %v to %v with block-height %d and tx-index %d failed since already have newer block-height %d and tx-index %d",
			e.Voter, e.Nodeslist, eventBlockHeight, eventBlockTxIndex, stateBlockHeight, stateBlockTxIndex))
	}

	// TODO noam due-diligent activist missing

	candidates := make([]byte, 0, len(e.Nodeslist)*20)
	for _, v := range e.Nodeslist {
		candidates = append(candidates, v[:]...)
	}

	state.WriteBytes(_formatActivistCandidateKey(e.Voter[:]), candidates)
	state.WriteUint64(_formatActivistBlockHeightKey(e.Voter[:]), eventBlockHeight)
	state.WriteUint32(_formatActivistBlockTxIndexKey(e.Voter[:]), eventBlockTxIndex)
}

func getVoteData(activist []byte) (addr []byte, blockNumber uint64, txIndex uint32) {
	return state.ReadBytes(_formatActivistCandidateKey(activist)),
		state.ReadUint64(_formatActivistBlockHeightKey(activist)),
		state.ReadUint32(_formatActivistBlockTxIndexKey(activist))
}

func _formatActivistCandidateKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Activist_%s_Candidates", hex.EncodeToString(delegator)))
}

func _formatActivistBlockHeightKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Activist_%s_BlockHeight", hex.EncodeToString(delegator)))
}

func _formatActivistBlockTxIndexKey(delegator []byte) []byte {
	return []byte(fmt.Sprintf("Activist_%s_BlockTxIndex", hex.EncodeToString(delegator)))
}

func processVoting() uint64 {
	currentBlock := ethereum.GetBlockNumber()
	if !_isAfterElectionMirroring(currentBlock) {
		panic("mirror period for election did not end, cannot start processing")
	}
	// save to state

	return 1
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
