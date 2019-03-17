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
