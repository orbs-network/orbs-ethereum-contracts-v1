package driver

import (
	"github.com/pkg/errors"
)

type Config struct {
	DebugLogs                    bool
	EthereumErc20Address         string
	EthereumValidatorsAddress    string
	EthereumValidatorsRegAddress string
	EthereumVotingAddress        string
	EthereumGuardiansAddress     string
	UserAccountOnOrbs            string
	DelegatorsNumber             int
	DelegatorStakeValues         []int
	GuardiansAccounts            []int
	ValidatorsAccounts           []int
	ValidatorsOrbsAddresses      []string
	ValidatorsOrbsIps            []string
	SetupOverEthereumBlock       int
	Transfers                    []*TransferEvent
	Delegates                    []*DelegateEvent
	Votes                        []*VoteEvent
	OrbsVotingContractName		 string
	FirstElectionBlockNumber	 int // zero to automatically determine after mirroring completes. positive value to enforce static value
}

func (config *Config) Validate(isDeploy bool) error {
	if !isDeploy {
		if config.EthereumErc20Address == "" {
			return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumErc20Address")
		}
		if config.EthereumValidatorsAddress == "" {
			return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumValidatorsAddress")
		}
		if config.EthereumValidatorsRegAddress == "" {
			return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumValidatorsRegAddress")
		}
		if config.EthereumVotingAddress == "" {
			return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumVotingAddress")
		}
		if config.EthereumGuardiansAddress == "" {
			return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumGuardiansAddress")
		}
	}
	if config.UserAccountOnOrbs == "" {
		return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "UserAccountOnOrbs")
	}
	// TODO v1 add array checks ?
	if config.DelegatorsNumber < 10 {
		return errors.Errorf("configuration field '%s' has invalid value '%d'", "DelegatorsNumber", config.DelegatorsNumber)
	}
	if len(config.DelegatorStakeValues) != config.DelegatorsNumber {
		return errors.Errorf("configuration field '%s' has invalid length '%d'", "DelegatorStakeValues", len(config.DelegatorStakeValues))
	}
	if len(config.GuardiansAccounts) < 3 {
		return errors.Errorf("configuration field '%s' has invalid length '%d'", "GuardiansAccounts", len(config.GuardiansAccounts))
	}
	if len(config.ValidatorsAccounts) < 5 {
		return errors.Errorf("configuration field '%s' has invalid length '%d'", "ValidatorsAccounts", len(config.ValidatorsAccounts))
	}
	if config.Transfers == nil || len(config.Transfers) < 10 {
		return errors.Errorf("configuration field '%s' has invalid length '%d'", "Transfers", len(config.Transfers))
	}
	return nil
}

type DelegateEvent struct {
	FromIndex int
	ToIndex   int
}

type TransferEvent struct {
	FromIndex int
	ToIndex   int
	Amount    int
}

type VoteEvent struct {
	ActivistIndex int
	Candidates    [3]int
}
