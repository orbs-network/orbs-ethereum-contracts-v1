// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

type OrbsAdapter interface {
	DeployERC20Contract(orbsErc20ContractName string, orbsAsbContractName string)
	DeployASBContract(orbsAsbContractName string, orbsErc20ContractName string)
	BindASBContractToEthereum(orbsAsbContractName string, ethereumAsbAddress string)
	OrbsUserIdToHexAddress(orbsUserId string) (userAccountOnOrbsHex string)
	TransferIn(orbsErc20ContractName string, orbsAsbContractName string, userAccountOnOrbs string, ethereumTxHash string) (userBalanceOnOrbsAfter int)
	TransferOut(orbsErc20ContractName string, orbsAsbContractName string, userAccountOnOrbs string, userAccountOnEthereum string, userTransferAmount int) (orbsTxId string, userBalanceOnOrbsAfter int)
	GetBalance(orbsErc20ContractName string, userAccountOnOrbs string) (userBalanceOnOrbs int)
	GenerateReceiptProof(orbsTxId string) (packedOrbsReceiptProof string, packedOrbsReceipt string)
}

type EthereumAdapter interface {
	DeployERC20Contract() (ethereumErc20Address string)
	DeployASBContract(ethereumErc20Address string, orbsAsbContractName string) (ethereumAsbAddress string)
	GetASBContractAddress() (ethereumAsbAddress string)
	FundUserAccount(ethereumErc20Address string, userAccountOnEthereum string, userInitialBalanceOnEthereum int) (userBalanceOnEthereumAfter int)
	TransferOut(ethereumErc20Address string, userAccountOnEthereum string, userAccountOnOrbs string, userTransferAmount int) (ethereumTxHash string, userBalanceOnEthereumAfter int)
	TransferIn(ethereumErc20Address string, userAccountOnEthereum string, packedOrbsReceiptProof string, packedOrbsReceipt string) (ethereumTxHash string, userBalanceOnEthereumAfter int)
	GetBalance(ethereumErc20Address string, userAccountOnEthereum string) (userBalanceOnEthereum int)
	WaitForFinality()
}
