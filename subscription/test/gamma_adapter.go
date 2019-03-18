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
