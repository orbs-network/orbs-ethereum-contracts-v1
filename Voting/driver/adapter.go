package driver

type OrbsAdapter interface {
	DeployContract(orbsVotingContractName string, orbsConfigContractName string)

	BindERC20ContractToEthereum(orbsVotingContractName string, ethereumErc20Address string)
	BindValidatorsContractToEthereum(orbsVotingContractName string, ethereumVotingAddress string)
	BindVotingContractToEthereum(orbsVotingContractName string, ethereumAsbAddress string)

	MirrorDelegateByTransfer(orbsVotingContractName string, transferTransactionHash string, transferBlockNumber int)

	RunVotingProcess(orbsVotingContractName string) bool
	GetElectedNodes(orbsConfigContractName string, blockHeight int) []string
}

type EthereumAdapter interface {
	GetStartOfHistoryBlock() int
	GetCurrentBlock() int

	DeployERC20Contract() (ethereumErc20Address string)
	FundStakeAccount(ethereumErc20Address string, userAccountIndexOnEthereum int, userInitialBalanceOnEthereum int) (userBalanceOnEthereumAfter int)
	GetBalance(ethereumErc20Address string, userAccountOnEthereum string) (userBalanceOnEthereum int)
	GetBalanceByIndex(ethereumErc20Address string, userAccountIndexOnEthereum int) (userBalanceOnEthereum int)
	TransferFundsAccount(ethereumErc20Address string, from int, to int, amount int)

	DeployValidatorsContract() (ethereumValidatorsAddress string)
	AddValidatorAccount(ethereumValidatorAddress string, validatorAccountOnEthereum string)

	DeployVotingContract() (ethereumVotingAddress string)
}
