package main

import (
	"encoding/hex"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
)

var PUBLIC = sdk.Export(updateElectionResults, getElectedNodesByHeight, getNumberOfNodesUpdates, getElectedNodesByIndex)
var SYSTEM = sdk.Export(_init)

var CURRENT_ELECTION_INDEX_KEY = []byte("_CURRENT_ELECTION_INDEX_KEY_")

func _init() {
}

func updateElectionResults() {

}

func getElectedNodesByHeight(blockHeight uint64) []byte {
	response, _ := hex.DecodeString("E1623DFC79Fe86FB966F5784E4196406E02469fC976b531A6e028fC3448321f3c210c119a2Fc8e8f9Df065a8EdB226B986BE68ff5f08Fe3F0310C066c3a5866f39f80021E9dba7cb76453A5BA4174231")
	return response
}

func getNumberOfNodesUpdates() uint64 {
	return state.ReadUint64(CURRENT_ELECTION_INDEX_KEY)
}

func setNumberOfNodesUpdates(index uint64) {
	state.WriteUint64(CURRENT_ELECTION_INDEX_KEY, index)
}

func getElectedNodesByIndex(index uint64) {

}
