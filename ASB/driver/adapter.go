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
}
