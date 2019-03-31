// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import (
	"github.com/orbs-network/orbs-ethereum-contracts/ASB/test/test"
	"github.com/stretchr/testify/require"
	"testing"
)

func RunOrbsToEthFlow(t *testing.T, config *test.Config, orbs test.OrbsAdapter, ethereum test.EthereumAdapter) {

	require.NoError(t, config.Validate())

	test.logStage("Checking balance in Orbs...")
	userOrbsInitialBalance := orbs.GetBalance(config.OrbsErc20ContractName, config.UserAccountOnOrbs)
	test.logStageDone("BalanceOnOrbs=%d", userOrbsInitialBalance)

	require.True(t, userOrbsInitialBalance >= config.UserTransferAmountBackToEthereum, "your Orbs account does not have enough tokens to transfer")

	test.logStage("Doing TransferOut from Orbs...")
	orbsTxId, userOrbsBalance := orbs.TransferOut(config.OrbsErc20ContractName, config.OrbsAsbContractName, config.UserAccountOnOrbs, config.UserAccountOnEthereum, config.UserTransferAmountBackToEthereum)
	test.logStageDone("OrbsTxId=%s BalanceOnOrbs=%d", orbsTxId, userOrbsBalance)

	require.Equal(t, userOrbsInitialBalance-config.UserTransferAmountBackToEthereum, userOrbsBalance)

	test.logStage("Generating receipt proof from Orbs...")
	packedOrbsReceiptProof, packedOrbsReceipt := orbs.GenerateReceiptProof(orbsTxId)
	test.logStageDone("OrbsReceiptProof=%s OrbsReceipt=%s", packedOrbsReceiptProof, packedOrbsReceipt)

	test.logStage("Checking balance in Ethereum...")
	ethereumInitialBalance := ethereum.GetBalance(config.EthereumErc20Address, config.UserAccountOnEthereum)
	test.logStageDone("BalanceOnEthereum=%d", ethereumInitialBalance)

	test.logStage("Doing TransferIn to Ethereum...")
	ethereumTxHash, userEthereumBalance := ethereum.TransferIn(config.EthereumErc20Address, config.UserAccountOnEthereum, packedOrbsReceiptProof, packedOrbsReceipt)
	test.logStageDone("EthereumTxHash=%s BalanceOnEthereum=%d", ethereumTxHash, userEthereumBalance)

	require.Equal(t, ethereumInitialBalance+config.UserTransferAmountBackToEthereum, userEthereumBalance)

	test.logSummary("All done.\n\n    BEFORE: %d tokens on Orbs + %d tokens on Ethereum\n    SWAP:   %d tokens Orbs -> Ethereum\n    AFTER:  %d tokens on Orbs + %d tokens on Ethereum\n\n", userOrbsInitialBalance, ethereumInitialBalance, config.UserTransferAmountBackToEthereum, userOrbsBalance, userEthereumBalance)

}
