// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import (
	"github.com/pkg/errors"
)

type Config struct {
	DebugLogs                        bool
	EthereumErc20Address             string
	OrbsErc20ContractName            string
	OrbsAsbContractName              string
	UserAccountOnEthereum            string
	UserAccountOnOrbs                string
	UserInitialBalanceOnEthereum     int
	UserTransferAmountToOrbs         int
	UserTransferAmountBackToEthereum int
}

func (config *Config) Validate() error {
	if config.EthereumErc20Address == "" {
		return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "EthereumErc20Address")
	}
	if config.OrbsErc20ContractName == "" {
		return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "OrbsErc20ContractName")
	}
	if config.OrbsAsbContractName == "" {
		return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "OrbsAsbContractName")
	}
	if config.UserAccountOnEthereum == "" {
		return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "UserAccountOnEthereum")
	}
	if config.UserAccountOnOrbs == "" {
		return errors.Errorf("configuration field '%s' is empty, did you forget to update it?", "UserAccountOnOrbs")
	}
	if config.UserInitialBalanceOnEthereum <= 0 {
		return errors.Errorf("configuration field '%s' has invalid value '%d'", "UserInitialBalanceOnEthereum", config.UserInitialBalanceOnEthereum)
	}
	if config.UserTransferAmountToOrbs <= 0 {
		return errors.Errorf("configuration field '%s' has invalid value '%d'", "UserTransferAmountToOrbs", config.UserTransferAmountToOrbs)
	}
	if config.UserTransferAmountBackToEthereum <= 0 {
		return errors.Errorf("configuration field '%s' has invalid value '%d'", "UserTransferAmountBackToEthereum", config.UserTransferAmountBackToEthereum)
	}
	return nil
}
