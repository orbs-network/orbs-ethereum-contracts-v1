// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package orbs_js_adapter

import (
	"encoding/json"
	"fmt"
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

func (ojs *OrbsJsSdkAdapter) DeployContract(orbsVotingContractName string) string {
	if orbsVotingContractName == "" {
		orbsVotingContractName = fmt.Sprintf("OrbsVoting_%d", time.Now().Unix())
	}
	ojs.run("deploy ./../../orbs/OrbsVoting/orbs_voting_contract.go -name " + orbsVotingContractName + " -signer user1")
	return orbsVotingContractName
}

func (ojs *OrbsJsSdkAdapter) SetContractConstants(orbsVotingContractName string) {
	ojs.run("send-tx ./gammacli-jsons/set-variables.json -signer user1 -name " + orbsVotingContractName +
		" -arg1 " + fmt.Sprintf("%d", ojs.voteMirrorPeriod) +
		" -arg2 " + fmt.Sprintf("%d", ojs.voteValidPeriod) +
		" -arg3 " + fmt.Sprintf("%d", ojs.electionPeriod) +
		" -arg4 " + fmt.Sprintf("%d", ojs.maxElectedValidators) +
		" -arg5 " + fmt.Sprintf("%d", ojs.minElectedValidators))
}

func (ojs *OrbsJsSdkAdapter) BindERC20ContractToEthereum(orbsVotingContractName string, ethereumErc20Address string) {
	ojs.run("send-tx ./gammacli-jsons/set-token-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumErc20Address)
}

func (ojs *OrbsJsSdkAdapter) BindValidatorsContractToEthereum(orbsVotingContractName string, ethereumValidatorsAddress string) {
	ojs.run("send-tx ./gammacli-jsons/set-validators-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumValidatorsAddress)
}

func (ojs *OrbsJsSdkAdapter) BindValidatorsRegistryContractToEthereum(orbsVotingContractName string, ethereumValidatorsRegistryAddress string) {
	ojs.run("send-tx ./gammacli-jsons/set-validators-registry-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumValidatorsRegistryAddress)
}

func (ojs *OrbsJsSdkAdapter) BindVotingContractToEthereum(orbsVotingContractName string, ethereumVotingAddress string) {
	ojs.run("send-tx ./gammacli-jsons/set-voting-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumVotingAddress)
}

func (ojs *OrbsJsSdkAdapter) BindGuardiansContractToEthereum(orbsVotingContractName string, ethereumGuardiansAddress string) {
	ojs.run("send-tx ./gammacli-jsons/set-guardians-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumGuardiansAddress)
}

func (ojs *OrbsJsSdkAdapter) SetElectionBlockNumber(orbsVotingContractName string, blockHeight int) {
	ojs.run("send-tx ./gammacli-jsons/set-first-election.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + fmt.Sprintf("%d", blockHeight))
}

func (ojs *OrbsJsSdkAdapter) GetElectedNodes(orbsVotingContractName string) []string {
	bytes := ojs.run("run-query ./gammacli-jsons/get-elected.json -signer user1 -name " + orbsVotingContractName)
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

func (ojs *OrbsJsSdkAdapter) ForwardElectionResultsToSystem(electedValidatorAddresses []string) {
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

	ojs.run("send-tx ./gammacli-jsons/forward-results-to-system.json -signer user1 -arg1 " + joinedAddresses)
}

func (ojs *OrbsJsSdkAdapter) SendTransactionGetProof() string {
	bytes := ojs.run("send-tx ./gammacli-jsons/generic-transaction.json -signer user1")
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

	bytes = ojs.run("tx-proof " + out.TxId)
	out2 := struct {
		PackedProof string
	}{}
	err = json.Unmarshal(bytes, &out2)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out2.PackedProof
}

func (ojs *OrbsJsSdkAdapter) GetFinalityBlocksComponent() int {
	return ojs.finalityBlocksComponent
}

func (ojs *OrbsJsSdkAdapter) GetFinalityTimeComponent() time.Duration {
	return ojs.finalityTimeComponent
}

func (ojs *OrbsJsSdkAdapter) GetMirrorVotingPeriod() int {
	return int(ojs.voteMirrorPeriod)
}

func (ojs *OrbsJsSdkAdapter) GetOrbsEnvironment() string {
	return ojs.env
}
