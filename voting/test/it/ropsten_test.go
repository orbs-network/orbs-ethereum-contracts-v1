package it

import (
	"github.com/orbs-network/orbs-ethereum-contracts/voting/test/it/driver"
	"testing"
)

// EDIT THIS CONFIGURATION TO CONTROL THE TEST SCENARIO
// DON'T FORGET TO UPDATE VALUES ACCORDING TO INSTRUCTIONS AFTER DEPLOY
var delegatorsNumberRopsten = 15
var guardiansAccountsRopsten = []int{4, 6, 10, 11}
var validatorAccountsRopsten = []int{20, 21, 22, 23, 24}
var configRopsten = &driver.Config{
	DebugLogs:                    true,                                                            // shows detailed responses for every command
	OrbsVotingContractName:       "",                                                              // name of the orbs contract
	EthereumErc20Address:         "",                                                              // update after deploy with the resulting value
	EthereumVotingAddress:        "",                                                              // update after deploy with the resulting value
	EthereumValidatorsAddress:    "",                                                              // update after deploy with the resulting value
	EthereumValidatorsRegAddress: "",                                                              // update after deploy with the resulting value
	EthereumGuardiansAddress:     "",                                                              // update after deploy with the resulting value
	UserAccountOnOrbs:            "user1",                                                         // one of the IDs in orbs-test-keys.json
	DelegatorsNumber:             delegatorsNumberRopsten,                                         // upto 20
	DelegatorStakeValues:         []int{100, 100, 80, 80, 60, 60, 40, 0, 200, 50, 50, 0, 0, 0, 0}, // should length  stakeholdernumber 10 is activist with no stake, 11-14 silent
	GuardiansAccounts:            guardiansAccounts,                                               // indexes of activists up to 20
	ValidatorsAccounts:           validatorAccounts,                                               // user index 20 ... if you have more than 5 add more Ropsten accounts
	ValidatorsOrbsAddresses:      []string{"0xf2915f50D9946a34Da51f746E85fD8A935Bea465", "0xbb92862fc7DC3bdA21294DB7b6c6628d9B65D49F", "0x38593d40b7F13f9CbF71e615dF4d51bb49947f86", "0x32489dF19c68E1881219F37e7AcabD9C05d405C4", "0xfE176d83686b87408988eeEb9835E282FF12fbFf"},
	ValidatorsOrbsIps:            []string{driver.IpToHexaBytes("18.219.51.57"), driver.IpToHexaBytes("54.193.117.100"), driver.IpToHexaBytes("34.210.94.85"), driver.IpToHexaBytes("63.35.108.49"), driver.IpToHexaBytes("18.196.28.98")},
	Transfers:                generateTransfersRopsten(delegatorsNumberRopsten, guardiansAccountsRopsten),
	Delegates:                generateDelegatesRopsten(delegatorsNumberRopsten, guardiansAccountsRopsten),
	Votes:                    generateVotesRopsten(guardiansAccountsRopsten, validatorAccountsRopsten),
	FirstElectionBlockNumber: 0, // zero to automatically determine after mirroring completes. positive value to enforce static value
}

// before starting:
// 1. make sure Ropsten is running locally on port 7545
// 2. change account setting to generate 25 accounts
// 3. make sure gamma server is running with `gamma-cli start-local`

func TestFullOnRopsten(t *testing.T) {

	orbs := gammaTestnet
	ethereum := truffleRopsten

	ethereum.PrintBalances()

	driver.RunDeployFlow(t, configRopsten, orbs, ethereum)
	driver.RunRecordFlow(t, configRopsten, orbs, ethereum)
	driver.RunMirrorFlow(t, configRopsten, orbs, ethereum)
	driver.RunProcessFlow(t, configRopsten, orbs, ethereum)
	driver.RunReclaimGuardianDepositsFlow(t, configRopsten, ethereum)

	ethereum.PrintBalances()
}

func TestDeployOnRopsten(t *testing.T) {

	orbs := gammaTestnet
	ethereum := truffleRopsten

	driver.RunDeployFlow(t, configRopsten, orbs, ethereum)
}

func TestRecordOnRopsten(t *testing.T) {

	orbs := gammaTestnet
	ethereum := truffleRopsten

	driver.RunRecordFlow(t, configRopsten, orbs, ethereum)
}

func TestMirrorAndProcessOnRopsten(t *testing.T) {

	orbs := gammaTestnet
	ethereum := truffleRopsten

	driver.RunMirrorFlow(t, configRopsten, orbs, ethereum)
	driver.RunProcessFlow(t, configRopsten, orbs, ethereum)
}

func TestReclaimGuardianDepositsOnRopsten(t *testing.T) {

	ethereum := truffleRopsten

	driver.RunReclaimGuardianDepositsFlow(t, configRopsten, ethereum)
}

// value 0 -> delegate.
// test calcs don't handle circular delegation
// test calcs handle two level indirection only
func generateTransfersRopsten(stakeHolderNumber int, activists []int) []*driver.TransferEvent {
	return []*driver.TransferEvent{
		{0, 6, 0},  // delegate
		{2, 6, 0},  // delegate
		{5, 3, 0},  // delegate // two level
		{8, 4, 50}, // regular transfer
		{8, 4, 0},  // delegate
		{8, 1, 10}, // regular transfer
		{3, 10, 0}, // delegate
		{9, 10, 0}, // delegate
		{7, 4, 0},  // delegate
		{2, 4, 0},  // delegate // change mind
		{8, 6, 0},  // delegate // change mind
		{5, 9, 10}, // regular transfer
	}
}

// test calcs don't handle circular delegation
func generateDelegatesRopsten(stakeHolderNumber int, activists []int) []*driver.DelegateEvent {
	return []*driver.DelegateEvent{
		{1, 4},  // delegate
		{7, 10}, // delegate already transfer
	}
}

// test calcs don't handle guardian that is a delegate or delegate that is guardian
func generateVotesRopsten(activists []int, validatorAccounts []int) []*driver.VoteEvent {
	return []*driver.VoteEvent{
		{4, []int{20, 22}},
		{10, []int{22, 23, 24}},
		{6, []int{22}},
		{4, []int{21}}, // revote
		{11, []int{}},
		//{15, [3]int{24, 21, 22}}, // not an guardian // TODO v1 noam
	}
}
