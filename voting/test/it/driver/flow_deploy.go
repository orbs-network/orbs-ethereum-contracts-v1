package driver

import (
	"fmt"
	"github.com/stretchr/testify/require"
	"testing"
)

func RunDeployFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(true))

	deployingEthereumErc20 := config.EthereumErc20Address == ""
	if deployingEthereumErc20 {
		logStage("Deploying Ethereum ERC20 contract...")
		config.EthereumErc20Address = ethereum.DeployERC20Contract()
		logStageDone("Ethereum ERC20 contract Address=%s", config.EthereumErc20Address)
	} else {
		logStage("Using existing Ethereum ERC20 contract...")
		logStageDone("Ethereum ERC20 Address=%s", config.EthereumErc20Address)
	}

	logStage("Setting Delegators' Ethereum staked account ...")
	ethereum.SetStakes(config.EthereumErc20Address, config.DelegatorStakeValues)
	balances := ethereum.GetStakes(config.EthereumErc20Address, config.DelegatorsNumber)
	require.Len(t, balances, len(config.DelegatorStakeValues))
	require.EqualValues(t, config.DelegatorStakeValues, balances)
	logStageDone("Stakes on Ethereum = %v", balances)

	deployingEthereumVoting := config.EthereumVotingAddress == ""
	if deployingEthereumVoting {
		logStage("Deploying Ethereum Voting contract...")
		config.EthereumVotingAddress = ethereum.DeployVotingContract()
		logStageDone("Ethereum Voting contract Address=%s", config.EthereumVotingAddress)
	} else {
		logStage("Using existing Ethereum Voting contract...")
		logStageDone("Ethereum Voting Address=%s", config.EthereumVotingAddress)
	}

	deployingEthereumValidators := config.EthereumValidatorsAddress == ""
	if deployingEthereumValidators {
		logStage("Deploying Ethereum Validators contracts ...")
		config.EthereumValidatorsAddress, config.EthereumValidatorsRegAddress = ethereum.DeployValidatorsContract()
		logStageDone("Ethereum Validators contract Address=%s\nEthereum Validators Registry contract Address=%s",
			config.EthereumValidatorsAddress, config.EthereumValidatorsRegAddress)

		logStage("Setting Ethereum Validators accounts ...")
		ethereum.SetValidators(config.EthereumValidatorsAddress, config.EthereumValidatorsRegAddress, config.ValidatorsAccounts)
		validators := ethereum.GetValidators(config.EthereumValidatorsAddress)
		require.Len(t, validators, len(config.ValidatorsAccounts))
		logStageDone("Set Validators to be %v", validators)
	} else {
		logStage("Using existing Ethereum Validators contract...")
		logStageDone("Ethereum Validators Address=%s", config.EthereumValidatorsAddress)
	}

	logStage("Binding Ethereum contracts to Orbs ...")
	orbs.BindERC20ContractToEthereum(getOrbsVotingContractName(), config.EthereumErc20Address)
	orbs.BindVotingContractToEthereum(getOrbsVotingContractName(), config.EthereumVotingAddress)
	orbs.BindValidatorsContractToEthereum(getOrbsVotingContractName(), config.EthereumValidatorsAddress)
	logStageDone("Bound")

	var erc20Txt, votingTxt, validatorTxt string
	if deployingEthereumErc20 {
		erc20Txt = fmt.Sprintf("EthereumErc20Address: %s\n", config.EthereumErc20Address)
	}
	if deployingEthereumVoting {
		votingTxt = fmt.Sprintf("EthereumVotingAddress: %s\n", config.EthereumVotingAddress)
	}
	if deployingEthereumValidators {
		validatorTxt = fmt.Sprintf("EthereumValidatorsAddress: %s\n", config.EthereumValidatorsAddress)
	}

	if erc20Txt != "" || votingTxt != "" || validatorTxt != "" {
		logSummary("IMPORTANT! Please update the test configuration with this value:\n%s%s%s\nDeploy Phase all done.\n\n", erc20Txt, votingTxt, validatorTxt)
	} else {
		logSummary("Deploy Phase all done.\n\n")
	}

}
