// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import "time"

type OrbsAdapter interface {
	DeployContract(orbsVotingContractName string) string
	SetContractConstants(orbsVotingContractName string)
	BindERC20ContractToEthereum(orbsVotingContractName string, ethereumErc20Address string)
	BindValidatorsContractToEthereum(orbsVotingContractName string, ethereumValidatorsAddress string)
	BindValidatorsRegistryContractToEthereum(orbsVotingContractName string, ethereumValidatorsRegistryAddress string)
	BindVotingContractToEthereum(orbsVotingContractName string, ethereumVotingAddress string)
	BindGuardiansContractToEthereum(orbsVotingContractName string, ethereumGuardiansAddress string)
	SetElectionBlockNumber(orbsVotingContractName string, blockHeight int)

	GetElectedNodes(orbsVotingContractName string) []string
	ForwardElectionResultsToSystem(electedValidatorAddresses []string)
	SendTransactionGetProof() string

	GetMirrorVotingPeriod() int
	GetOrbsEnvironment() string
	GetFinalityBlocksComponent() int
	GetFinalityTimeComponent() time.Duration
}

type EthereumAdapter interface {
	GetStartOfHistoryBlock() int
	GetCurrentBlock() int

	DeployERC20Contract() (ethereumErc20Address string)
	GetStakes(ethereumErc20Address string, numberOfStakes int) (stakes map[int]float32)
	SetStakes(ethereumErc20Address string, stakes []float32)
	Transfer(ethereumErc20Address string, from int, to int, amount float32)
	TopUpEther(accountIndexes []int)
	PrintBalances()

	DeployValidatorsContract() (ethereumValidatorsAddress string, ethereumValidatorsRegAddress string)
	GetValidators(ethereumValidatorsAddress string, ethereumValidatorsRegAddress string) []validatorData
	SetValidators(ethereumValidatorsAddress string, ethereumValidatorsRegAddress string, validators []int, orbsAddresses []string, orbsIps []string)

	DeployVotingContract() (ethereumVotingAddress string)
	Delegate(ethereumVotingAddress string, from int, to int)
	Vote(ethereumVotingAddress string, activistInded int, to []int)

	DeployGuardiansContract() (ethereumGuardiansAddress string)
	SetGuardians(ethereumGuardiansAddress string, guardians []int)
	ResignGuardians(ethereumGuardiansAddress string, guardians []int)

	WaitForBlock(blockNumber int)
	GetConnectionUrl() string
}

type NodeScriptAdapter interface {
	Mirror(orbsVotingContractName string, gammaEnv string)
	Process(orbsVotingContractName string, ethereumErc20Address string, ethereumVotingAddress string, startBlock int, endBlock int, ethereumUrl string, gammaEnv string)
}
