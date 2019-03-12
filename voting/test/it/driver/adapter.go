package driver

type OrbsAdapter interface {
	DeployContract(orbsVotingContractName string)
	SetContractConstants(orbsVotingContractName string)
	BindERC20ContractToEthereum(orbsVotingContractName string, ethereumErc20Address string)
	BindValidatorsContractToEthereum(orbsVotingContractName string, ethereumValidatorsAddress string)
	BindValidatorsRegistryContractToEthereum(orbsVotingContractName string, ethereumValidatorsRegistryAddress string)
	BindVotingContractToEthereum(orbsVotingContractName string, ethereumVotingAddress string)
	BindGuardiansContractToEthereum(orbsVotingContractName string, ethereumGuardiansAddress string)
	SetFirstElectionBlockNumber(orbsVotingContractName string, blockHeight int)

	GetElectedNodes(orbsVotingContractName string) []string
	ForwardElectionResultsToSystem(electedValidatorAddresses []string)
	GetCurrentSystemBlockSigners() []string

	GetStakeFactor() uint64
	GetMirrorVotingPeriod() int
	GetOrbsEnvironment() string
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
	SetValidators(ethereumValidatorsAddress string, ethereumValidatorsRegAddress string, validators []int, orbsAddresses []string, orbsIps []string)

	DeployVotingContract() (ethereumVotingAddress string)
	Delegate(ethereumVotingAddress string, from int, to int)
	Vote(ethereumVotingAddress string, activistInded int, to [3]int)

	DeployGuardiansContract() (ethereumGuardiansAddress string)
	SetGuardians(ethereumGuardiansAddress string, guardians []int)

	Mine(blocks int)
	GetConnectionUrl() string
}

type NodeScriptAdapter interface {
	Mirror(orbsVotingContractName string, gammaEnv string)
	Process(orbsVotingContractName string, ethereumErc20Address string, ethereumVotingAddress string, startBlock int, endBlock int, ethereumUrl string, gammaEnv string)
}
