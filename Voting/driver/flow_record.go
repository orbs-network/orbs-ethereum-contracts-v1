package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunRecordFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate())

	logSummary("Recording Phase all done.\n\n")

}
