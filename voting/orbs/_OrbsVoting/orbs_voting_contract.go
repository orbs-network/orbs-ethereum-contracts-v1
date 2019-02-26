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
	processVoting)
var SYSTEM = sdk.Export(_init, setTokenAbi, setVotingAbi, setValidatorsAbi, setOrbsValidatorsConfigContract /* TODO v1 security run once */)

//var EVENTS = sdk.Export(OrbsTransferredOut)

// defaults other contracts
const defaultOrbsValidatorsConfigContract = "OrbsValidatorsConfig"
const defaultTokenAbi = `[{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"constant":false,"inputs":[{"name":"_account","type":"address"},{"name":"_value","type":"uint256"}],"name":"assign","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]`
const defaultTokenAddr = "0xE1623DFC79Fe86FB966F5784E4196406E02469fD"
const defaultVotingAbi = `[{"constant":true,"inputs":[],"name":"vote_counter","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0xcab1e244"},{"constant":true,"inputs":[],"name":"delegation_counter","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function","signature":"0xf28583cd"},{"anonymous":false,"inputs":[{"indexed":true,"name":"activist","type":"address"},{"indexed":false,"name":"candidates","type":"address[]"},{"indexed":false,"name":"vote_counter","type":"uint256"}],"name":"Vote","type":"event","signature":"0x8e74707f33682297df744388ec6b7a56c219db104289e482dd949ba15f80213d"},{"anonymous":false,"inputs":[{"indexed":true,"name":"stakeholder","type":"address"},{"indexed":true,"name":"activist","type":"address"},{"indexed":false,"name":"delegation_counter","type":"uint256"}],"name":"Delegate","type":"event","signature":"0x510b11bb3f3c799b11307c01ab7db0d335683ef5b2da98f7697de744f465eacc"},{"constant":false,"inputs":[{"name":"candidates","type":"address[]"}],"name":"vote","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0xed081329"},{"constant":false,"inputs":[{"name":"activist","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function","signature":"0x5c19a95c"}]`
const defaultVotingAddr = "0xE1623DFC79Fe86FB966F5784E4196406E02469fE"
const defaultValidatorsAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"tuid","type":"uint256"},{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"bytes20"},{"indexed":false,"name":"value","type":"uint256"}],"name":"EthTransferredOut","type":"event"}]`
const defaultValidatorsAddr = "0xE1623DFC79Fe86FB966F5784E4196406E02469fC"

// parameters
var DELEGATION_NAME = "Delegate"
var DELEGATION_BY_TRANSFER_NAME = "Transfer"
var DELEGATION_BY_TRANSFER_VALUE = big.NewInt(7)

// state keys
var ORBS_CONFIG_CONTRACT_KEY = []byte("_TOKEN_CONTRACT_KEY_")
var TOKEN_ETH_ADDR_KEY = []byte("_TOKEN_ETH_ADDR_KEY_")
var TOKEN_ABI_KEY = []byte("_TOKEN_ABI_KEY_")
var VOTING_ETH_ADDR_KEY = []byte("_VOTING_ETH_ADDR_KEY_")
var VOTING_ABI_KEY = []byte("_VOTING_ABI_KEY_")
var VALIDATORS_ETH_ADDR_KEY = []byte("_VALIDATORS_ETH_ADDR_KEY_")
var VALIDATORS_ABI_KEY = []byte("_VALIDATORS_ABI_KEY_")

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
	_validateBlockHeightFitForMirroring()
	e := &Transfer{}
	ethereum.GetTransactionLog(getTokenAddr(), getTokenAbi(), hexEncodedEthTxHash, DELEGATION_BY_TRANSFER_NAME, e)

	eventBlockHeight := uint64(100) // TODO noam value
	eventBlockTxIndex := uint64(10) // TODO noam value

	if DELEGATION_BY_TRANSFER_VALUE.Cmp(e.Value) != 0 {
		panic(fmt.Errorf("mirrorDelegateByTransfer from %v to %v failed since %d is wrong delegation value", e.From, e.To, e.Value.Uint64()))
	}

	_mirrorDelegationData(e.From, e.To, eventBlockHeight, eventBlockTxIndex, DELEGATION_BY_TRANSFER_NAME)
}

type Delegate struct {
	Delegator [20]byte
	Agent     [20]byte
}

func mirrorDelegation(hexEncodedEthTxHash string) {
	_validateBlockHeightFitForMirroring()
	e := &Delegate{}
	ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, DELEGATION_NAME, e)
	eventBlockHeight := uint64(100) // TODO noam value
	eventBlockTxIndex := uint64(10) // TODO noam value

	_mirrorDelegationData(e.Delegator, e.Agent, eventBlockHeight, eventBlockTxIndex, DELEGATION_NAME)
}

func _mirrorDelegationData(delegator [20]byte, agent [20]byte, eventBlockHeight uint64, eventBlockTxIndex uint64, eventName string) {
	stateMethod := state.ReadString(_formatDelegatorMethod(delegator))
	if stateMethod == DELEGATION_NAME && eventName == DELEGATION_BY_TRANSFER_NAME {
		panic(fmt.Errorf("delegate with medthod %s from %v to %v failed since already have delegation with method %s",
			eventName, delegator, agent, stateMethod))
	} else if stateMethod == eventName {
		stateBlockHeight := state.ReadUint64(_formatDelegatorBlockHeightKey(delegator))
		stateBlockTxIndex := state.ReadUint64(_formatDelegatorBlockTxIndexKey(delegator))
		if stateBlockHeight > eventBlockHeight || (stateBlockHeight == eventBlockHeight && stateBlockTxIndex > eventBlockTxIndex) {
			panic(fmt.Errorf("delegate from %v to %v with block-height %d and tx-index %d failed since already have newer block-height %d and tx-index %d",
				delegator, agent, eventBlockHeight, eventBlockTxIndex, stateBlockHeight, stateBlockTxIndex))
		}
	}

	state.WriteBytes(_formatDelegatorAgentKey(delegator), agent[:])
	state.WriteUint64(_formatDelegatorBlockHeightKey(delegator), eventBlockHeight)
	state.WriteUint64(_formatDelegatorBlockTxIndexKey(delegator), eventBlockTxIndex)
	state.WriteString(_formatDelegatorMethod(delegator), eventName)
}

func _formatDelegatorAgentKey(delegator [20]byte) []byte {
	return []byte(fmt.Sprintf("StakeHolder_%s_Agent", hex.EncodeToString(delegator[:])))
}

func _formatDelegatorBlockHeightKey(delegator [20]byte) []byte {
	return []byte(fmt.Sprintf("StakeHolder_%s_BlockHeight", hex.EncodeToString(delegator[:])))
}

func _formatDelegatorBlockTxIndexKey(delegator [20]byte) []byte {
	return []byte(fmt.Sprintf("StakeHolder_%s_BlockTxIndex", hex.EncodeToString(delegator[:])))
}

func _formatDelegatorMethod(delegator [20]byte) []byte {
	return []byte(fmt.Sprintf("StakeHolder_%s_Method", hex.EncodeToString(delegator[:])))
}

type Vote struct {
	Activist   [20]byte
	Candidates [][20]byte
}

func mirrorVote(hexEncodedEthTxHash string) {
	_validateBlockHeightFitForMirroring()
	e := &Vote{}
	ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, "Vote", e)
	eventBlockHeight := uint64(100) // TODO noam value
	eventBlockTxIndex := uint64(10) // TODO noam value
	stateBlockHeight := state.ReadUint64(_formatActivistBlockHeightKey(e.Activist))
	stateBlockTxIndex := state.ReadUint64(_formatActivistBlockTxIndexKey(e.Activist))
	if stateBlockHeight > eventBlockHeight || (stateBlockHeight == eventBlockHeight && stateBlockTxIndex > eventBlockTxIndex) {
		panic(fmt.Errorf("vote of activist %v to %v with block-height %d and tx-index %d failed since already have newer block-height %d and tx-index %d",
			e.Activist, e.Candidates, eventBlockHeight, eventBlockTxIndex, stateBlockHeight, stateBlockTxIndex))
	}

	// TODO noam due-diligent activist missing

	candidates := make([]byte, 0, len(e.Candidates)*20)
	for _, v := range e.Candidates {
		candidates = append(candidates, v[:]...)
	}

	state.WriteBytes(_formatActivistCandidateKey(e.Activist), candidates)
	state.WriteUint64(_formatActivistBlockHeightKey(e.Activist), eventBlockHeight)
	state.WriteUint64(_formatActivistBlockTxIndexKey(e.Activist), eventBlockTxIndex)
}

func _formatActivistCandidateKey(delegator [20]byte) []byte {
	return []byte(fmt.Sprintf("Activist_%s_Candidates", hex.EncodeToString(delegator[:])))
}

func _formatActivistBlockHeightKey(delegator [20]byte) []byte {
	return []byte(fmt.Sprintf("Activist_%s_BlockHeight", hex.EncodeToString(delegator[:])))
}

func _formatActivistBlockTxIndexKey(delegator [20]byte) []byte {
	return []byte(fmt.Sprintf("Activist_%s_BlockTxIndex", hex.EncodeToString(delegator[:])))
}

func _validateBlockHeightFitForMirroring() {
	blockHeight := uint64(0) // TODO read
	// TODO is past election date
	if _isAfterElectionMirroring(blockHeight) {
		// TODO panic
	}
}

func processVoting() uint64 {
	_isAfterElectionMirroring(0)
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

func _getDelegatorStake(hexEncodedEthAddr string, blockNumber uint64) {
	var stake uint64
	ethereum.CallMethod(getTokenAddr(), getTokenAbi(), "balanceOf", hexEncodedEthAddr, &stake)
}

func _isAfterElectionMirroring(blockHeight uint64) bool {
	// TODO noam fill
	return true
}

func setWinners() {

}

//type _stakeHolder struct {
//	blockHeight  int
//	blockTxIndex int
//	updatedBy    string
//	agent        [20]byte
//}
//
//func _getStakeHolder(addr [20]byte) *_stakeHolder {
//
//}
//
//func _setStakeHolder(addr [20]byte, value *_stakeHolder) {
//
//}

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
