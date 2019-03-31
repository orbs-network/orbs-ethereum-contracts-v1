// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func RunReclaimGuardianDepositsFlow(t *testing.T, config *Config, ethereum EthereumAdapter) {
	require.NoError(t, config.Validate(false))

	logStage("Resigning guardians")
	ethereum.ResignGuardians(config.EthereumGuardiansAddress, config.GuardiansAccounts)
	logStageDone("Resigning guardians")

	logSummary("Recording Phase all done.\n\n")
}
