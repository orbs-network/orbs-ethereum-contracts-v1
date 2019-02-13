package main

import (
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/ethereum"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	"math/big"
)

var PUBLIC = sdk.Export(setTokenContract, getVotingAddr, getVotingAbi, getTokenContract,
	recordDelegateByTransfer, recordDelegateDirectly, recordVote,
	calculateWinners, getDelegatorStake)
var SYSTEM = sdk.Export(_init, setVotingAbi, setVotingAddr)

//var EVENTS = sdk.Export(OrbsTransferredOut)

// defaults
const defaultTokenContract = "Erc20TokenProxy"
const defaultVotingAbi = `[{"anonymous":false,"inputs":[{"indexed":true,"name":"tuid","type":"uint256"},{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"bytes20"},{"indexed":false,"name":"value","type":"uint256"}],"name":"EthTransferredOut","type":"event"}]`
const defaultVotingAddr = "0xE1623DFC79Fe86FB966F5784E4196406E02469fC"

// state keys
var TOKEN_CONTRACT_KEY = []byte("_TOKEN_CONTRACT_KEY_")
var ASB_ETH_ADDR_KEY = []byte("_ASB_ETH_ADDR_KEY_")
var ASB_ABI_KEY = []byte("_ASB_ABI_KEY_")
var OUT_TUID_KEY = []byte("_OUT_TUID_KEY_")
var IN_TUID_KEY = []byte("_IN_TUID_KEY_")
var IN_TUID_MAX_KEY = []byte("_IN_TUID_KEY_")

func _init() {
	setVotingAbi(defaultVotingAbi)
	setVotingAddr(defaultVotingAddr)
	setTokenContract(defaultTokenContract)

}

type Transfer struct {
	From  [20]byte
	To    [20]byte
	Value *big.Int
}

func recordDelegateByTransfer(hexEncodedEthTxHash string, blockNumber uint64) {
	e := &Transfer{}
	ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, "Transfer", e)

}

type Delegate struct {
	From [20]byte
	To   [20]byte
}

func recordDelegateDirectly(hexEncodedEthTxHash string, blockNumber uint64) {
	e := &Delegate{}
	ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, "Delegate", e)

}

type Vote struct {
	Voter                [20]byte
	CommaListOfAddresses string
}

func recordVote(hexEncodedEthTxHash string, blockNumber uint64) {
	e := &Vote{}
	ethereum.GetTransactionLog(getVotingAddr(), getVotingAbi(), hexEncodedEthTxHash, "Vote", e)

}

func getDelegatorStake(hexEncodedEthTxHash string, blockNumber uint64) {
	var stake uint64
	ethereum.CallMethod(getVotingAddr(), getVotingAbi(), "balanceOf", &stake)
}

func calculateWinners() {

	// save to state
}

func getWinners() {

	// read from state
}

//type EthTransferredOut struct {
//	Tuid  *big.Int
//	From  [20]byte
//	To    [20]byte
//	Value *big.Int
//}
//
//func OrbsTransferredOut(
//	tuid uint64,
//	orbsAddress []byte,
//	ethAddress []byte,
//	amount uint64) {
//}

//func transferIn(hexEncodedEthTxHash string) {
//	asbAddr := getVotingAddr()
//	e := &EthTransferredOut{}
//	ethereum.GetTransactionLog(asbAddr, getVotingAbi(), hexEncodedEthTxHash, "EthTransferredOut", e)
//
//	if e.Tuid == nil {
//		panic("Got nil tuid from logs")
//	}
//
//	if e.Value == nil || e.Value.Cmp(big.NewInt(0)) <= 0 {
//		panic("Got nil or non positive value from log")
//	}
//
//	address.ValidateAddress(e.To[:])
//
//	inTuidKey := genInTuidKey(e.Tuid.Bytes())
//	if isInTuidExists(inTuidKey) {
//		panic(fmt.Errorf("transfer of %d to address %x failed since inbound-tuid %d has already been spent", e.Value, e.To, e.Tuid))
//	}
//
//	service.CallMethod(getTokenContract(), "asbMint", e.To[:], e.Value.Uint64())
//
//	setInTuid(inTuidKey)
//	setInTuidMax(e.Tuid.Uint64())
//}
//
//func transferOut(ethAddr []byte, amount uint64) {
//	tuid := safeuint64.Add(getOutTuid(), 1)
//	setOutTuid(tuid)
//
//	sourceOrbsAddress := address.GetSignerAddress()
//	service.CallMethod(getTokenContract(), "asbBurn", sourceOrbsAddress, amount)
//
//	events.EmitEvent(OrbsTransferredOut, tuid, sourceOrbsAddress, ethAddr, amount)
//}

func getVotingAddr() string {
	return state.ReadString(ASB_ETH_ADDR_KEY)
}

func setVotingAddr(asbAddr string) { // upgrade
	state.WriteString(ASB_ETH_ADDR_KEY, asbAddr)
}

func getVotingAbi() string {
	return state.ReadString(ASB_ABI_KEY)
}

func setVotingAbi(asbAbi string) { // upgrade
	state.WriteString(ASB_ABI_KEY, asbAbi)
}

func getTokenContract() string {
	return state.ReadString(TOKEN_CONTRACT_KEY)
}

func setTokenContract(erc20Proxy string) { // upgrade
	state.WriteString(TOKEN_CONTRACT_KEY, erc20Proxy)
}
