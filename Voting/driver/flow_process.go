package driver

import (
	"github.com/stretchr/testify/require"
	"testing"
)

func RunProcessFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate())

	logSummary("Mirror Phase all done.\n\n And the winners are ....")

}
