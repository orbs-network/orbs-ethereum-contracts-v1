// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package orbs_js_adapter

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"time"
)

func NewOrbsJsSdkAdapter(
	debug bool,
	env string,
	voteMirrorPeriod uint64,
	voteValidPeriod uint64,
	electionPeriod uint64,
	maxElectedValidators int,
	minElectedValidators int,
	finalityBlocksComponent int,
	finalityTimeComponent time.Duration,
) *OrbsJsSdkAdapter {
	return &OrbsJsSdkAdapter{
		debug:                   debug,
		env:                     env,
		voteMirrorPeriod:        voteMirrorPeriod,
		voteValidPeriod:         voteValidPeriod,
		electionPeriod:          electionPeriod,
		maxElectedValidators:    maxElectedValidators,
		minElectedValidators:    minElectedValidators,
		finalityBlocksComponent: finalityBlocksComponent,
		finalityTimeComponent:   finalityTimeComponent,
	}
}

type OrbsJsSdkAdapter struct {
	debug                   bool
	env                     string
	voteMirrorPeriod        uint64
	voteValidPeriod         uint64
	electionPeriod          uint64
	maxElectedValidators    int
	minElectedValidators    int
	finalityBlocksComponent int
	finalityTimeComponent   time.Duration
}

func (gamma *OrbsJsSdkAdapter) DeployContract(orbsVotingContractName string) string {
	if orbsVotingContractName == "" {
		orbsVotingContractName = fmt.Sprintf("OrbsVoting_%d", time.Now().Unix())
	}
	gamma.run("deploy ./../../orbs/OrbsVoting/orbs_voting_contract.go -name " + orbsVotingContractName + " -signer user1")
	return orbsVotingContractName
}

func (gamma *OrbsJsSdkAdapter) SetContractConstants(orbsVotingContractName string) {
	gamma.run("send-tx ./gammacli-jsons/set-variables.json -signer user1 -name " + orbsVotingContractName +
		" -arg1 " + fmt.Sprintf("%d", gamma.voteMirrorPeriod) +
		" -arg2 " + fmt.Sprintf("%d", gamma.voteValidPeriod) +
		" -arg3 " + fmt.Sprintf("%d", gamma.electionPeriod) +
		" -arg4 " + fmt.Sprintf("%d", gamma.maxElectedValidators) +
		" -arg5 " + fmt.Sprintf("%d", gamma.minElectedValidators))
}

func (gamma *OrbsJsSdkAdapter) BindERC20ContractToEthereum(orbsVotingContractName string, ethereumErc20Address string) {
	gamma.run("send-tx ./gammacli-jsons/set-token-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumErc20Address)
}

func (gamma *OrbsJsSdkAdapter) BindValidatorsContractToEthereum(orbsVotingContractName string, ethereumValidatorsAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-validators-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumValidatorsAddress)
}

func (gamma *OrbsJsSdkAdapter) BindValidatorsRegistryContractToEthereum(orbsVotingContractName string, ethereumValidatorsRegistryAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-validators-registry-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumValidatorsRegistryAddress)
}

func (gamma *OrbsJsSdkAdapter) BindVotingContractToEthereum(orbsVotingContractName string, ethereumVotingAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-voting-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumVotingAddress)
}

func (gamma *OrbsJsSdkAdapter) BindGuardiansContractToEthereum(orbsVotingContractName string, ethereumGuardiansAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-guardians-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumGuardiansAddress)
}

func (gamma *OrbsJsSdkAdapter) SetElectionBlockNumber(orbsVotingContractName string, blockHeight int) {
	gamma.run("send-tx ./gammacli-jsons/set-first-election.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + fmt.Sprintf("%d", blockHeight))
}

func (gamma *OrbsJsSdkAdapter) GetElectedNodes(orbsVotingContractName string) []string {
	bytes := gamma.run("run-query ./gammacli-jsons/get-elected.json -signer user1 -name " + orbsVotingContractName)
	out := struct {
		OutputArguments []*struct {
			Value string
		}
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}

	lenoutput := (len(out.OutputArguments[0].Value) - 2) / 40
	respose := make([]string, lenoutput)
	for i := 0; i < lenoutput; i++ {
		respose[i] = "0x" + strings.ToLower(out.OutputArguments[0].Value[i*40+2:(i+1)*40+2])
	}

	return respose
}

func (gamma *OrbsJsSdkAdapter) ForwardElectionResultsToSystem(electedValidatorAddresses []string) {
	joinedAddresses := "0x"
	for _, address := range electedValidatorAddresses {
		if strings.HasPrefix(address, "0x") {
			address = address[2:]
		}
		joinedAddresses += address
	}
	if (len(joinedAddresses)-2)%40 != 0 {
		panic(fmt.Sprintf("joined addresses is not a multiply of 20 bytes: %s", joinedAddresses))
	}

	gamma.run("send-tx ./gammacli-jsons/forward-results-to-system.json -signer user1 -arg1 " + joinedAddresses)
}

func (gamma *OrbsJsSdkAdapter) SendTransactionGetProof() string {
	bytes := gamma.run("send-tx ./gammacli-jsons/generic-transaction.json -signer user1")
	out := struct {
		TxId string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	if len(out.TxId) == 0 {
		panic("could not get the TxId after sending a generic transaction")
	}

	bytes = gamma.run("tx-proof " + out.TxId)
	out2 := struct {
		PackedProof string
	}{}
	err = json.Unmarshal(bytes, &out2)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out2.PackedProof
}

func (gamma *OrbsJsSdkAdapter) GetFinalityBlocksComponent() int {
	return gamma.finalityBlocksComponent
}

func (gamma *OrbsJsSdkAdapter) GetFinalityTimeComponent() time.Duration {
	return gamma.finalityTimeComponent
}

func (gamma *OrbsJsSdkAdapter) run(args string, env ...string) []byte {
	args += " -env " + gamma.env
	if gamma.debug {
		fmt.Println("\n  ### RUNNING: gamma-cli " + args)
		if len(env) > 0 {
			fmt.Printf("      ENV: %+v", env)
		}
		fmt.Printf("\n  ### OUTPUT:\n\n")
	}
	argsArr := strings.Split(args, " ")
	cmd := exec.Command("gamma-cli", argsArr...)
	//cmd := exec.Command("/Users/noam/work/src/github.com/orbs-network/gamma-cli/_bin/gamma-cli", argsArr...)
	var out []byte
	var err error
	if gamma.debug {
		out, err = combinedOutputWithStdoutPipe(cmd)
	} else {
		out, err = cmd.CombinedOutput()
	}
	if err != nil {
		panic(err.Error() + "\n" + string(out))
	}
	return out
}

func (gamma *OrbsJsSdkAdapter) GetMirrorVotingPeriod() int {
	return int(gamma.voteMirrorPeriod)
}

func (gamma *OrbsJsSdkAdapter) GetOrbsEnvironment() string {
	return gamma.env
}

func combinedOutputWithStdoutPipe(c *exec.Cmd) ([]byte, error) {
	if c.Stdout != nil {
		return nil, errors.New("exec: Stdout already set")
	}
	if c.Stderr != nil {
		return nil, errors.New("exec: Stderr already set")
	}
	var b bytes.Buffer
	w := io.MultiWriter(&b, os.Stdout)
	c.Stdout = w
	c.Stderr = w
	err := c.Run()
	return b.Bytes(), err
}