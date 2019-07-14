package elections_systemcontract

import (
	. "github.com/orbs-network/orbs-contract-sdk/go/testing/unit"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestOrbsVotingContract_initCurrentElectionBlockNumber(t *testing.T) {
	tests := []struct {
		name                     string
		expectCurrentBlockNumber uint64
		ethereumBlockNumber      uint64
	}{
		{"before is 0", FIRST_ELECTION_BLOCK, 0},
		{"before is a small number", FIRST_ELECTION_BLOCK, 5000000},
		{"before is after first but before second", FIRST_ELECTION_BLOCK + ELECTION_PERIOD_LENGTH_IN_BLOCKS, FIRST_ELECTION_BLOCK + 5000},
		{"before is after second", FIRST_ELECTION_BLOCK + 2*ELECTION_PERIOD_LENGTH_IN_BLOCKS, FIRST_ELECTION_BLOCK + ELECTION_PERIOD_LENGTH_IN_BLOCKS + 5000},
	}
	for i := range tests {
		cTest := tests[i]
		t.Run(cTest.name, func(t *testing.T) {
			InServiceScope(nil, nil, func(m Mockery) {
				_init()
				m.MockEthereumGetBlockNumber(int(cTest.ethereumBlockNumber))
				initCurrentElectionBlockNumber()
				after := getCurrentElectionBlockNumber()
				require.EqualValues(t, cTest.expectCurrentBlockNumber, after, "'%s' failed ", cTest.name)
			})
		})
	}
}

func TestOrbsVotingContract_blockBased_IsProccessPeriod_yes(t *testing.T) {
	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		m.MockEthereumGetBlockNumber(100 + int(VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS) + 1)
		_setCurrentElectionBlockNumber(100)

		require.EqualValues(t, 1, _isProcessingPeriodBlockBased(), "should be process period (1)")
	})
}

func TestOrbsVotingContract_blockBased_IsProccessPeriod_no(t *testing.T) {
	InServiceScope(nil, nil, func(m Mockery) {
		_init()
		m.MockEthereumGetBlockNumber(100 + int(VOTE_MIRROR_PERIOD_LENGTH_IN_BLOCKS) - 1)
		_setCurrentElectionBlockNumber(100)

		require.EqualValues(t, 0, _isProcessingPeriodBlockBased(), "should not be process period (0)")
	})
}
