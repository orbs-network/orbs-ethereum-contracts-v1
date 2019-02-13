package driver

type OrbsAdapter interface {
	DeployContract(orbsVotingContractName string, orbsConfigContractName string)

	BindERC20ContractToEthereum(orbsVotingContractName string, ethereumErc20Address string)
	BindValidatorsContractToEthereum(orbsVotingContractName string, ethereumVotingAddress string)
	BindVotingContractToEthereum(orbsVotingContractName string, ethereumAsbAddress string)
}

type EthereumAdapter interface {
	DeployERC20Contract() (ethereumErc20Address string)
	DeployValidatorsContract() (ethereumValidatorsAddress string)
	DeployVotingContract() (ethereumVotingAddress string)
	FundStakeAccount(ethereumErc20Address string, userAccountIndexOnEthereum int, userInitialBalanceOnEthereum int) (userBalanceOnEthereumAfter int)
	GetBalance(ethereumErc20Address string, userAccountOnEthereum string) (userBalanceOnEthereum int)
	GetBalanceByIndex(ethereumErc20Address string, userAccountIndexOnEthereum int) (userBalanceOnEthereum int)
	AddValidatorAccount(ethereumValidatorAddress string, validatorAccountOnEthereum string)
}
