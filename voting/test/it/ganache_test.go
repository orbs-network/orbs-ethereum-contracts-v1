package it

import (
	"github.com/orbs-network/orbs-ethereum-contracts/voting/test/it/driver"
	"testing"
)

// EDIT THIS CONFIGURATION TO CONTROL THE TEST SCENARIO
// DON'T FORGET TO UPDATE VALUES ACCORDING TO INSTRUCTIONS AFTER DEPLOY
var stakeHoldersNumber = 15
var activistsAccounts = []int{4, 6, 10}
var validatorAccounts = []int{20, 21, 22, 23, 24}
var configGanache = &driver.Config{
	DebugLogs:                 true,                                                            // shows detailed responses for every command
	EthereumErc20Address:      "",                                                              // update after deploy with the resulting value
	EthereumValidatorsAddress: "",                                                              // update after deploy with the resulting value
	EthereumVotingAddress:     "",                                                              // update after deploy with the resulting value
	UserAccountOnEthereum:     "0xd1948B0252242B60DAb2E3566AD2971B87868644",                    // one of your ganache accounts
	UserAccountOnOrbs:         "user1",                                                         // one of the IDs in orbs-test-keys.json
	StakeHoldersNumber:        stakeHoldersNumber,                                              // upto 20
	StakeHolderValues:         []int{100, 100, 80, 80, 60, 60, 40, 0, 200, 50, 0, 0, 50, 0, 0}, // should length  stakeholdernumber 10 is activist with no stake, 11-14 silent
	ActivistsAccounts:         activistsAccounts,                                               // indexes of activists up to 20
	ValidatorsAccounts:        validatorAccounts,                                               // user index 20 ... if you have more than 5 add more ganache accounts
	Transfers:                 generateTransfers(stakeHoldersNumber, activistsAccounts),
	Delegates:                 generateDelegates(stakeHoldersNumber, activistsAccounts),
	Votes:                     generateVotes(activistsAccounts, validatorAccounts),
}

// before starting:
// 1. make sure ganache is running locally on port 7545
// 2. change account setting to generate 25 accounts
// 3. make sure gamma server is running with `gamma-cli start-local`

//func TestDeployOnGanache(t *testing.T, orbs driver.OrbsAdapter, ethereum driver.EthereumAdapter) {
//	orbs = generateOrbsIfNil(orbs)
//	ethereum = generateEthereumIfNil(ethereum)
//	//	ethereum := driver.AdapterForTruffleGanache(configGanache)
//	//	driver.RunDeployFlow(t, configGanache, orbs, ethereum)
//}
//
//func TestRecordOnGanache(t *testing.T, orbs driver.OrbsAdapter, ethereum driver.EthereumAdapter) {
//	orbs = generateOrbsIfNil(orbs)
//	ethereum = generateEthereumIfNil(ethereum)
//	//	driver.RunDeployFlow(t, configGanache, orbs, ethereum)
//}
//
//func TestMirrorOnGanache(t *testing.T, orbs driver.OrbsAdapter, ethereum driver.EthereumAdapter) {
//	orbs = generateOrbsIfNil(orbs)
//	ethereum = generateEthereumIfNil(ethereum)
//	//	driver.RunDeployFlow(t, configGanache, orbs, ethereum)
//}
//
//func TestProcessOnGanache(t *testing.T, orbs driver.OrbsAdapter, ethereum driver.EthereumAdapter) {
//	orbs = generateOrbsIfNil(orbs)
//	//	ethereum := driver.AdapterForTruffleGanache(configGanache)
//	//	driver.RunDeployFlow(t, configGanache, orbs, ethereum)
//}

func TestFullFlowOnGanache(t *testing.T) {

	orbs := driver.AdapterForGammaCliLocal(configGanache)
	ethereum := driver.AdapterForTruffleGanache(configGanache)

	// Temp deploy of orbs contracts
	orbs.DeployContract("OrbsVoting", "OrbsValidatorsConfig")

	driver.RunDeployFlow(t, configGanache, orbs, ethereum)
	driver.RunRecordFlow(t, configGanache, orbs, ethereum)
	driver.RunMirrorFlow(t, configGanache, orbs, ethereum)
	driver.RunProcessFlow(t, configGanache, orbs, ethereum)
}

// value 0 -> delegate.
func generateTransfers(stakeHolderNumber int, activists []int) []*driver.TransferEvent {
	return []*driver.TransferEvent{
		{0, 6, 0},  // delegate
		{2, 6, 0},  // delegate
		{5, 3, 0},  // delegate // two level
		{8, 4, 50}, // regular transfer
		{8, 4, 0},  // delegate
		//		{1, 4, 0},  // delegate
		{8, 1, 10}, // regular transfer
		{3, 10, 0}, // delegate
		{9, 10, 0}, // delegate
		{7, 4, 0},  // delegate
		{2, 4, 0},  // delegate // change mind
		{8, 6, 0},  // delegate // change mind
		{5, 9, 10}, // regular transfer
	}

}

func generateDelegates(stakeHolderNumber int, activists []int) []*driver.DelegateEvent {
	return []*driver.DelegateEvent{
		{1, 4},  // delegate
		{7, 10}, // delegate already transfer
	}
}

func generateVotes(activists []int, validatorAccounts []int) []*driver.VoteEvent {
	return []*driver.VoteEvent{
		{4, [3]int{20, 21, 22}},
		{10, [3]int{22, 23, 24}},
		{6, [3]int{20, 21, 22}},
		{4, [3]int{24, 21, 22}},  // revote
		{15, [3]int{24, 21, 22}}, // not an activist
	}

}
