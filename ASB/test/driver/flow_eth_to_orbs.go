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

func RunEthToOrbsFlow(t *testing.T, config *test.Config, orbs test.OrbsAdapter, ethereum test.EthereumAdapter) {

	require.NoError(t, config.Validate())

	test.logStage("Checking balance in Ethereum...")
	ethereumInitialBalance := ethereum.GetBalance(config.EthereumErc20Address, config.UserAccountOnEthereum)
	test.logStageDone("BalanceOnEthereum=%d", ethereumInitialBalance)

	require.True(t, ethereumInitialBalance >= config.UserTransferAmountToOrbs, "your Ethereum account does not have enough tokens to transfer")

	test.logStage("Checking balance in Orbs...")
	userOrbsInitialBalance := orbs.GetBalance(config.OrbsErc20ContractName, config.UserAccountOnOrbs)
	test.logStageDone("BalanceOnOrbs=%d", userOrbsInitialBalance)

	test.logStage("Doing TransferOut from Ethereum...")
	ethereumTxHash, userEthereumBalance := ethereum.TransferOut(config.EthereumErc20Address, config.UserAccountOnEthereum, orbs.OrbsUserIdToHexAddress(config.UserAccountOnOrbs), config.UserTransferAmountToOrbs)
	test.logStageDone("EthereumTxHash=%s BalanceOnEthereum=%d", ethereumTxHash, userEthereumBalance)

	require.Equal(t, ethereumInitialBalance-config.UserTransferAmountToOrbs, userEthereumBalance)

	ethereum.WaitForFinality()

	test.logStage("Doing TransferIn to Orbs...")
	userOrbsBalance := orbs.TransferIn(config.OrbsErc20ContractName, config.OrbsAsbContractName, config.UserAccountOnOrbs, ethereumTxHash)
	test.logStageDone("BalanceOnOrbs=%d", userOrbsBalance)

	require.Equal(t, userOrbsInitialBalance+config.UserTransferAmountToOrbs, userOrbsBalance)

	test.logSummary("All done.\n\n    BEFORE: %d tokens on Ethereum + %d tokens on Orbs\n    SWAP:   %d tokens Ethereum -> Orbs\n    AFTER:  %d tokens on Ethereum + %d tokens on Orbs\n\n", ethereumInitialBalance, userOrbsInitialBalance, config.UserTransferAmountToOrbs, userEthereumBalance, userOrbsBalance)

}
