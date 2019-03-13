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
	for i, conifgBalance := range config.DelegatorStakeValues {
		require.EqualValues(t, conifgBalance, balances[i])
	}
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
	deployingEthereumValidatorsReg := config.EthereumValidatorsRegAddress == ""
	if deployingEthereumValidators {
		logStage("Deploying Ethereum Validators contracts ...")
		config.EthereumValidatorsAddress, config.EthereumValidatorsRegAddress = ethereum.DeployValidatorsContract()
		logStageDone("Ethereum Validators contract Address=%s\nEthereum Validators Registry contract Address=%s",
			config.EthereumValidatorsAddress, config.EthereumValidatorsRegAddress)

		logStage("Setting Ethereum Validators accounts ...")
		ethereum.SetValidators(config.EthereumValidatorsAddress, config.EthereumValidatorsRegAddress, config.ValidatorsAccounts, config.ValidatorsOrbsAddresses, config.ValidatorsOrbsIps)
		validators := ethereum.GetValidators(config.EthereumValidatorsAddress, config.EthereumValidatorsRegAddress)
		require.Len(t, validators, len(config.ValidatorsAccounts))
		logStageDone("Set Validators to be %v", validators)
	} else {
		logStage("Using existing Ethereum Validators & Validator Registry contracts ...")
		logStageDone("Ethereum Validators Address=%s\nEthereum Validators Registry Address=%s", config.EthereumValidatorsAddress, config.EthereumValidatorsRegAddress)
	}

	deployingEthereumGuardians := config.EthereumGuardiansAddress == ""
	if deployingEthereumGuardians {
		logStage("Deploying Ethereum Guardians contracts ...")
		config.EthereumGuardiansAddress = ethereum.DeployGuardiansContract()
		logStageDone("Ethereum Guardians contract Address=%s", config.EthereumGuardiansAddress)

		logStage("Setting Ethereum Guardians accounts ...")
		ethereum.SetGuardians(config.EthereumGuardiansAddress, config.GuardiansAccounts)
		logStageDone("Set Guardians done")
	} else {
		logStage("Using existing Ethereum Guardians contract...")
		logStageDone("Ethereum Guardians Address=%s", config.EthereumGuardiansAddress)
	}

	logStage("Binding Ethereum contracts to Orbs ...")
	orbs.BindERC20ContractToEthereum(config.OrbsVotingContractName, config.EthereumErc20Address)
	orbs.BindVotingContractToEthereum(config.OrbsVotingContractName, config.EthereumVotingAddress)
	orbs.BindValidatorsContractToEthereum(config.OrbsVotingContractName, config.EthereumValidatorsAddress)
	orbs.BindValidatorsRegistryContractToEthereum(config.OrbsVotingContractName, config.EthereumValidatorsRegAddress)
	orbs.BindGuardiansContractToEthereum(config.OrbsVotingContractName, config.EthereumGuardiansAddress)
	logStageDone("Bound")

	var erc20Txt, votingTxt, validatorTxt, validatorRegTxt, guardianTxt string
	if deployingEthereumErc20 {
		erc20Txt = fmt.Sprintf(`EthereumErc20Address: "%s",`+"\n", config.EthereumErc20Address)
	}
	if deployingEthereumVoting {
		votingTxt = fmt.Sprintf(`EthereumVotingAddress: "%s",`+"\n", config.EthereumVotingAddress)
	}
	if deployingEthereumGuardians {
		guardianTxt = fmt.Sprintf(`EthereumGuardiansAddress: "%s",`+"\n", config.EthereumGuardiansAddress)
	}
	if deployingEthereumValidators {
		validatorTxt = fmt.Sprintf(`EthereumValidatorsAddress: "%s",`+"\n", config.EthereumValidatorsAddress)
	}
	if deployingEthereumValidatorsReg {
		validatorRegTxt = fmt.Sprintf(`EthereumValidatorsRegAddress: "%s",`+"\n", config.EthereumValidatorsRegAddress)
	}

	if erc20Txt != "" || votingTxt != "" || validatorTxt != "" || validatorRegTxt != "" || guardianTxt != "" {
		logSummary("IMPORTANT! Please update the test configuration with this value:\n%s%s%s%s%s\nDeploy Phase all done.\n\n", erc20Txt, votingTxt, validatorTxt, validatorRegTxt, guardianTxt)
	} else {
		logSummary("Deploy Phase all done.\n\n")
	}

}
