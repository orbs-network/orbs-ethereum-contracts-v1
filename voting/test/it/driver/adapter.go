package driver

type OrbsAdapter interface {
	DeployContract(orbsVotingContractName string, orbsConfigContractName string)
	SetFirstElectionBlockHeight(orbsVotingContractName string, blockHeight int)

	BindERC20ContractToEthereum(orbsVotingContractName string, ethereumErc20Address string)
	BindValidatorsContractToEthereum(orbsVotingContractName string, ethereumVotingAddress string)
	BindVotingContractToEthereum(orbsVotingContractName string, ethereumAsbAddress string)

	MirrorDelegateByTransfer(orbsVotingContractName string, transferTransactionHash string)
	MirrorDelegate(orbsVotingContractName string, transferTransactionHash string)
	MirrorVote(orbsVotingContractName string, transferTransactionHash string)
	GetVoteData(orbsVotingContractName string, activist string) (addresses string, blockNumber uint64, txIndex uint32)
	GetDelegateData(orbsVotingContractName string, delegator string) (addr string, blockNumber uint64, txIndex uint32, method string)
	GetDelegatorStakeAtBlockNumber(orbsVotingContractName string, delegator string, blockNumber int) int

	RunVotingProcess(orbsVotingContractName string) bool
	GetElectedNodes(orbsConfigContractName string, blockHeight int) []string
}

type EthereumAdapter interface {
	GetStartOfHistoryBlock() int
	GetCurrentBlock() int

	DeployERC20Contract() (ethereumErc20Address string)
	GetStakes(ethereumErc20Address string, numberOfStakes int) (stakes []int)
	SetStakes(ethereumErc20Address string, stakes []int)
	Transfer(ethereumErc20Address string, from int, to int, amount int)

	DeployValidatorsContract() (ethereumValidatorsAddress string, ethereumValidatorsRegAddress string)
	GetValidators(ethereumValidatorsAddress string) []string
	SetValidators(ethereumValidatorsAddress string, ethereumValidatorsRegAddress string, validators []int)

	DeployVotingContract() (ethereumVotingAddress string)
	Delegate(ethereumVotingAddress string, from int, to int)
	Vote(ethereumVotingAddress string, activistInded int, to [3]int)
}

type NodeScriptAdapter interface {
	FindDelegateByTransferEvents(ethereumVotingAddress string, startBlock int, endBlock int) []delegateByTransferData
	FindDelegateEvents(ethereumVotingAddress string, startBlock int, endBlock int) []delegateData
	FindVoteEvents(ethereumVotingAddress string, startBlock int, endBlock int) []voteData
}
