package it

import (
	"flag"
	"fmt"
	"github.com/orbs-network/orbs-ethereum-contracts/voting/test/it/driver"
	"os"
	"testing"
	"time"
)

const STAKE_FACTOR = 10000

const ENV_TESTNET_ROPSTEN = "ropsten"
const ENV_TESTNET_LIVE = "mainnet"
const ENV_DEV_LATEST = "experimental" // value must match a valid gamma-cli env
const ENV_DEV_STABLE = "local"        // value must match a valid gamma-cli env

var env string

func TestMain(m *testing.M) {
	flag.StringVar(&env, "env", ENV_DEV_LATEST, "Select your testing environemnt: local, experimental, ropsten or mainnet. default: experimental")
	flag.Parse()

	fmt.Printf("\n\nLaunching test environment: %s\n\n", env)

	os.Exit(m.Run())
}

func adapterFactory(env string) (orbs driver.OrbsAdapter, ethereum driver.EthereumAdapter) {

	// ORBS ADAPTER
	switch env {
	case ENV_DEV_LATEST, ENV_DEV_STABLE:
		orbs = driver.NewGammaCliAdapter(
			true,
			env,
			STAKE_FACTOR,
			10,
			500,
			200,
			5,
			3,
			1,
			10*time.Second,
		)
	case ENV_TESTNET_ROPSTEN, ENV_TESTNET_LIVE:
		orbs = driver.NewGammaCliAdapter(
			true,
			"integrative",
			STAKE_FACTOR,
			30,
			500,
			200,
			10,
			7,
			10,
			10*time.Minute+5*time.Second,
		)
	default:
		panic(fmt.Sprintf("Unsupported env %s", env))
	}

	// ETHEREUM ADAPTER
	switch env {
	case ENV_DEV_LATEST, ENV_DEV_STABLE:
		ethereum = driver.NewTruffleAdapter(
			true,
			".",
			"ganache",
			getEnv("GANACHE_HOST", "http://127.0.0.1:7545"),
			0,
			STAKE_FACTOR,
		)
	case ENV_TESTNET_ROPSTEN:
		ethereum = driver.NewTruffleAdapter(
			true,
			".",
			"ropsten",
			requireEnv("ROPSTEN_URL"),
			5196956,
			STAKE_FACTOR,
		)
	case ENV_TESTNET_LIVE:
		ethereum = driver.NewTruffleAdapter(
			true,
			".",
			"mainnet",
			requireEnv("MAINNET_URL"),
			7374356,
			STAKE_FACTOR,
		)
	}
	return
}

// EDIT THIS CONFIGURATION TO CONTROL THE TEST SCENARIO
// DON'T FORGET TO UPDATE VALUES ACCORDING TO INSTRUCTIONS AFTER DEPLOY
var delegatorsNumber = 15
var guardiansAccounts = []int{4, 6, 10, 11}
var validatorAccounts = []int{20, 21, 22, 23, 24}
var config = &driver.Config{
	DebugLogs:                    true,                                                            // shows detailed responses for every command
	OrbsVotingContractName:       "",                                                    // by default use the system contract for elections, put "" to deploy with a random name
	EthereumErc20Address:         "",                                                              // update after deploy with the resulting value
	EthereumVotingAddress:        "",                                                              // update after deploy with the resulting value
	EthereumValidatorsAddress:    "",                                                              // update after deploy with the resulting value
	EthereumValidatorsRegAddress: "",                                                              // update after deploy with the resulting value
	EthereumGuardiansAddress:     "",                                                              // update after deploy with the resulting value
	UserAccountOnOrbs:            "user1",                                                         // one of the IDs in orbs-test-keys.json
	DelegatorsNumber:             delegatorsNumber,                                                // upto 20
	DelegatorStakeValues:         []int{100, 100, 80, 80, 60, 60, 40, 0, 200, 50, 50, 0, 0, 0, 0}, // should length  stakeholdernumber 10 is activist with no stake, 11-14 silent
	GuardiansAccounts:            guardiansAccounts,                                               // indexes of activists up to 20
	ValidatorsAccounts:           validatorAccounts,                                               // user index 20 ... if you have more than 5 configure truffle for more accounts
	ValidatorsOrbsAddresses:      []string{"0xf2915f50D9946a34Da51f746E85fD8A935Bea465", "0xbb92862fc7DC3bdA21294DB7b6c6628d9B65D49F", "0x38593d40b7F13f9CbF71e615dF4d51bb49947f86", "0x32489dF19c68E1881219F37e7AcabD9C05d405C4", "0xfE176d83686b87408988eeEb9835E282FF12fbFf"},
	ValidatorsOrbsIps:            []string{driver.IpToHexaBytes("18.219.51.57"), driver.IpToHexaBytes("54.193.117.100"), driver.IpToHexaBytes("34.210.94.85"), driver.IpToHexaBytes("63.35.108.49"), driver.IpToHexaBytes("18.196.28.98")},
	Transfers:                    generateTransfers(delegatorsNumber, guardiansAccounts),
	Delegates:                    generateDelegates(delegatorsNumber, guardiansAccounts),
	Votes:                        generateVotes(guardiansAccounts, validatorAccounts),
	FirstElectionBlockNumber:     0, // zero to automatically determine after mirroring completes. positive value to enforce static value
}

// before starting:
// 1. make sure ganache is running locally on port 7545
// 2. change account setting to generate 25 accounts
// 3. make sure gamma server is running with `gamma-cli start-local`

func TestFullFlow(t *testing.T) {

	orbs, ethereum := adapterFactory(env)

	ethereum.PrintBalances()

	driver.RunDeployFlow(t, config, orbs, ethereum)
	driver.RunRecordFlow(t, config, orbs, ethereum)
	driver.RunMirrorFlow(t, config, orbs, ethereum)
	driver.RunProcessFlow(t, config, orbs, ethereum)

	driver.RunReclaimGuardianDepositsFlow(t, config, ethereum)

	ethereum.PrintBalances()
}

func TestDeploy(t *testing.T) {
	orbs, ethereum := adapterFactory(env)

	driver.RunDeployFlow(t, config, orbs, ethereum)
}

func TestRecord(t *testing.T) {
	orbs, ethereum := adapterFactory(env)

	driver.RunRecordFlow(t, config, orbs, ethereum)
}

func TestMirrorAndProcess(t *testing.T) {
	orbs, ethereum := adapterFactory(env)

	driver.RunMirrorFlow(t, config, orbs, ethereum)
	driver.RunProcessFlow(t, config, orbs, ethereum)
}

func TestReclaimGuardianDeposits(t *testing.T) {
	_, ethereum := adapterFactory(env)

	driver.RunReclaimGuardianDepositsFlow(t, config, ethereum)
}

// value 0 -> delegate.
// test calcs don't handle circular delegation
// test calcs handle two level indirection only
func generateTransfers(stakeHolderNumber int, activists []int) []*driver.TransferEvent {
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
func generateDelegates(stakeHolderNumber int, activists []int) []*driver.DelegateEvent {
	return []*driver.DelegateEvent{
		{1, 4},  // delegate
		{7, 10}, // delegate already transfer
	}
}

// test calcs don't handle guardian that is a delegate or delegate that is guardian
func generateVotes(activists []int, validatorAccounts []int) []*driver.VoteEvent {
	return []*driver.VoteEvent{
		{4, []int{20, 22}},
		{10, []int{22, 23, 24}},
		{6, []int{22}},
		{4, []int{21}}, // revote
		{11, []int{}},
		{15, []int{24, 21, 22}}, // not an guardian
	}
}

func getEnv(varName string, defaultVal string) string {
	result, envOverride := os.LookupEnv(varName)
	if envOverride == false {
		result = defaultVal
	}
	return result
}

func requireEnv(varName string) string {
	result, envOverride := os.LookupEnv(varName)
	if envOverride == false {
		panic(fmt.Sprintf("Please set %s", varName))
	}
	return result
}
