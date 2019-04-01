// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunOrbsToEthFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate())

	logStage("Checking balance in Orbs...")
	userOrbsInitialBalance := orbs.GetBalance(config.OrbsErc20ContractName, config.UserAccountOnOrbs)
	logStageDone("BalanceOnOrbs=%d", userOrbsInitialBalance)

	require.True(t, userOrbsInitialBalance >= config.UserTransferAmountBackToEthereum, "your Orbs account does not have enough tokens to transfer")

	logStage("Doing TransferOut from Orbs...")
	orbsTxId, userOrbsBalance := orbs.TransferOut(config.OrbsErc20ContractName, config.OrbsAsbContractName, config.UserAccountOnOrbs, config.UserAccountOnEthereum, config.UserTransferAmountBackToEthereum)
	logStageDone("OrbsTxId=%s BalanceOnOrbs=%d", orbsTxId, userOrbsBalance)

	require.Equal(t, userOrbsInitialBalance-config.UserTransferAmountBackToEthereum, userOrbsBalance)

	logStage("Generating receipt proof from Orbs...")
	packedOrbsReceiptProof, packedOrbsReceipt := orbs.GenerateReceiptProof(orbsTxId)
	logStageDone("OrbsReceiptProof=%s OrbsReceipt=%s", packedOrbsReceiptProof, packedOrbsReceipt)

	logStage("Checking balance in Ethereum...")
	ethereumInitialBalance := ethereum.GetBalance(config.EthereumErc20Address, config.UserAccountOnEthereum)
	logStageDone("BalanceOnEthereum=%d", ethereumInitialBalance)

	logStage("Doing TransferIn to Ethereum...")
	ethereumTxHash, userEthereumBalance := ethereum.TransferIn(config.EthereumErc20Address, config.UserAccountOnEthereum, packedOrbsReceiptProof, packedOrbsReceipt)
	logStageDone("EthereumTxHash=%s BalanceOnEthereum=%d", ethereumTxHash, userEthereumBalance)

	require.Equal(t, ethereumInitialBalance+config.UserTransferAmountBackToEthereum, userEthereumBalance)

	logSummary("All done.\n\n    BEFORE: %d tokens on Orbs + %d tokens on Ethereum\n    SWAP:   %d tokens Orbs -> Ethereum\n    AFTER:  %d tokens on Orbs + %d tokens on Ethereum\n\n", userOrbsInitialBalance, ethereumInitialBalance, config.UserTransferAmountBackToEthereum, userOrbsBalance, userEthereumBalance)

}
