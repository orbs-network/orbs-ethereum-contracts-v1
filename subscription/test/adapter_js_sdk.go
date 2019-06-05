// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package test

import (
	"encoding/json"
	"github.com/pkg/errors"
)

type OrbsJsSdkAdapter struct {
	env                     string
}

func (g *OrbsJsSdkAdapter) SendATransaction() error {
	bytes := g.run("send-tx ./gammacli-jsons/generic-transaction.json -signer user1")
	out := struct {
		TxId              string
		ExecutionResult   string
		TransactionStatus string
	}{}

	if err := json.Unmarshal(bytes, &out); err != nil {
		return errors.Wrapf(err, "failed deserializing json")
	}

	if "SUCCESS" != out.ExecutionResult || "COMMITTED" != out.TransactionStatus{
		return errors.Errorf("execution failed; output is %s", bytes)
	}

	return nil
}

func (g *OrbsJsSdkAdapter) RefreshSubscription(address string) error {
	bytes := g.run("send-tx ./gammacli-jsons/refresh-subscription.json -signer user1 -arg1 " + address)
	out := struct {
		TxId              string
		ExecutionResult   string
		TransactionStatus string
	}{}
	if err := json.Unmarshal(bytes, &out); err != nil {
		return errors.Wrapf(err, "failed deserializing json")
	}

	if "SUCCESS" != out.ExecutionResult || "COMMITTED" != out.TransactionStatus{
		return errors.Errorf("execution failed; output is %s", bytes)
	}
	return nil
}

func NewOrbsAdapter() *OrbsJsSdkAdapter {
	return &OrbsJsSdkAdapter{env: "experimental"}
}
