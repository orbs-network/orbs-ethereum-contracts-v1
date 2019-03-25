// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package test

import (
	"encoding/json"
	"github.com/pkg/errors"
	"os/exec"
	"strings"
)

type gammaCliAdapter struct {
	env string
}

func (g *gammaCliAdapter) run(args string) []byte {
	args += " -env " + g.env
	argsArr := strings.Split(args, " ")
	cmd := exec.Command("gamma-cli", argsArr...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		panic(err.Error() + "\n" + string(out))
	}
	return out
}

func (g *gammaCliAdapter) sendATransaction() error {
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

func (g *gammaCliAdapter) refreshSubscription(address string) error {
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

func newGamma() *gammaCliAdapter {
	return &gammaCliAdapter{env: "experimental"}
}
