package Voting

import (
	"github.com/orbs-network/orbs-ethereum-contracts/Voting/driver"
	"github.com/stretchr/testify/require"
	"testing"
)

// EDIT THIS CONFIGURATION TO CONTROL THE TEST SCENARIO
// DON'T FORGET TO UPDATE VALUES ACCORDING TO INSTRUCTIONS AFTER DEPLOY
var configGanache = &driver.Config{
	DebugLogs:                 true,                                            // shows detailed responses for every command
	EthereumErc20Address:      "",                                              // update after deploy with the resulting value
	EthereumValidatorsAddress: "",                                              // update after deploy with the resulting value
	EthereumVotingAddress:     "",                                              // update after deploy with the resulting value
	UserAccountOnEthereum:     "0xd1948B0252242B60DAb2E3566AD2971B87868644",    // one of your ganache accounts
	UserAccountOnOrbs:         "user1",                                         // one of the IDs in orbs-test-keys.json
	StakeHoldersNumber:        10,                                              // upto 20
	StakeHoldersInitialValues: []int{100, 100, 80, 80, 60, 60, 40, 0, 200, 50}, // should length upto stakeholdernumber
	ActivistsAccounts:         []int{4, 6, 10},                                 // indexes of activists up to 20
	ValidatorsNumber:          5,                                               // user index 20 ... if you have more than 5 add more ganache accounts
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

	require.NoError(t, configGanache.Validate())

	orbs := driver.AdapterForGammaCliLocal(configGanache)
	ethereum := driver.AdapterForTruffleGanache(configGanache)
	driver.RunDeployFlow(t, configGanache, orbs, ethereum)
	driver.RunRecordFlow(t, configGanache, orbs, ethereum)
	driver.RunMirrorFlow(t, configGanache, orbs, ethereum)
	driver.RunProcessFlow(t, configGanache, orbs, ethereum)

	//TestDeployOnGanache(t, orbs, ethereum)
	//TestRecordOnGanache(t, orbs, ethereum)
	//TestMirrorOnGanache(t, orbs, ethereum)
	//TestProcessOnGanache(t, orbs, ethereum)
}

//func generateOrbsIfNil(orbs driver.OrbsAdapter) driver.OrbsAdapter {
//	if orbs == nil {
//		orbs = driver.AdapterForGammaCliLocal(configGanache)
//	}
//	return orbs
//}
//
//func generateEthereumIfNil(ethereum driver.EthereumAdapter) driver.EthereumAdapter {
//	if ethereum == nil {
//		ethereum = driver.AdapterForTruffleGanache(configGanache)
//	}
//	return ethereum
//}
