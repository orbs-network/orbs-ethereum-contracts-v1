package driver

import (
	"github.com/pkg/errors"
)

type Config struct {
	DebugLogs                 bool
	EthereumErc20Address      string
	EthereumValidatorsAddress string
	EthereumVotingAddress     string
	UserAccountOnEthereum     string
	UserAccountOnOrbs         string
	StakeHoldersNumber        int
	StakeHoldersInitialValues []int
	ActivistsAccounts         []int
	ValidatorsNumber          int
}

func (config *Config) Validate() error {
	//if config.EthereumErc20Address == "" {
	//	return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumErc20Address")
	//}
	//if config.EthereumValidatorsAddress == "" {
	//	return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "OrbsErc20ContractName")
	//}
	//if config.EthereumVotingAddress == "" {
	//	return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "OrbsAsbContractName")
	//}
	if config.UserAccountOnEthereum == "" {
		return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "UserAccountOnEthereum")
	}
	if config.UserAccountOnOrbs == "" {
		return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "UserAccountOnOrbs")
	}
	// TODO v1 add array checks ?
	if config.StakeHoldersNumber < 10 {
		return errors.Errorf("configuration field '%s' has invalid value '%d'", "StakeHoldersNumber", config.StakeHoldersNumber)
	}
	if len(config.StakeHoldersInitialValues) != config.StakeHoldersNumber {
		return errors.Errorf("configuration field '%s' has invalid length '%d'", "StakeHoldersInitialValues", config.StakeHoldersInitialValues)
	}
	if len(config.ActivistsAccounts) < 3 {
		return errors.Errorf("configuration field '%s' has invalid length '%d'", "ActivistsAccounts", config.ActivistsAccounts)
	}
	if config.ValidatorsNumber < 5 {
		return errors.Errorf("configuration field '%s' has invalid value '%d'", "ValidatorsNumber", config.ValidatorsNumber)
	}
	return nil
}
