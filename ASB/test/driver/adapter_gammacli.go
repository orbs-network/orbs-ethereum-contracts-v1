// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os/exec"
	"strconv"
	"strings"
)

func AdapterForGammaCliLocal(config *Config) OrbsAdapter {
	return &gammaCliAdapter{
		debug: config.DebugLogs,
		env:   "experimental", // use "local" for the stable local gamma-cli ... or for client tests
	}
}

func AdapterForGammaCliTestnet(config *Config) OrbsAdapter {
	return &gammaCliAdapter{
		debug: config.DebugLogs,
		env:   "testnet",
	}
}

type gammaCliAdapter struct {
	debug bool
	env   string
}

func (gc *gammaCliAdapter) DeployERC20Contract(orbsErc20ContractName string, orbsAsbContractName string) {
	gc.run("deploy ./orbs-contracts/_OrbsERC20Proxy/contract.go -name " + orbsErc20ContractName + " -signer user1")
	gc.run("send-tx ./gammacli-jsons/erc20proxy-asb-bind.json -signer user1 -name " + orbsErc20ContractName + " -arg1 " + orbsAsbContractName)
}

func (gc *gammaCliAdapter) DeployASBContract(orbsAsbContractName string, orbsErc20ContractName string) {
	gc.run("deploy ./orbs-contracts/_OrbsASB/contract.go -name " + orbsAsbContractName + " -signer user1")
	gc.run("send-tx ./gammacli-jsons/asb-reset.json -signer user1 -name " + orbsAsbContractName)
	gc.run("send-tx ./gammacli-jsons/asb-set-token.json -signer user1 -name " + orbsAsbContractName + " -arg1 " + orbsErc20ContractName)
}

func (gc *gammaCliAdapter) BindASBContractToEthereum(orbsAsbContractName string, ethereumAsbAddress string) {
	gc.run("send-tx ./gammacli-jsons/asb-set-address.json -signer user1 -name " + orbsAsbContractName + " -arg1 " + ethereumAsbAddress)
}

func (gc *gammaCliAdapter) TransferIn(orbsErc20ContractName string, orbsAsbContractName string, userAccountOnOrbs string, ethereumTxHash string) (userBalanceOnOrbsAfter int) {
	gc.run("send-tx ./gammacli-jsons/transfer-in.json -signer " + userAccountOnOrbs + " -name " + orbsAsbContractName + " -arg1 " + ethereumTxHash)
	return gc.GetBalance(orbsErc20ContractName, userAccountOnOrbs)
}

func (gc *gammaCliAdapter) TransferOut(orbsErc20ContractName string, orbsAsbContractName string, userAccountOnOrbs string, userAccountOnEthereum string, userTransferAmount int) (orbsTxId string, userBalanceOnOrbsAfter int) {
	amount := fmt.Sprintf("%d", userTransferAmount)
	bytes := gc.run("send-tx ./gammacli-jsons/transfer-out.json -signer " + userAccountOnOrbs + " -name " + orbsAsbContractName + " -arg1 " + strings.ToLower(userAccountOnEthereum) + " -arg2 " + amount)
	out := struct {
		TxId string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out.TxId, gc.GetBalance(orbsErc20ContractName, userAccountOnOrbs)
}

func (gc *gammaCliAdapter) GetBalance(orbsErc20ContractName string, userAccountOnOrbs string) (userBalanceOnOrbs int) {
	bytes := gc.run("run-query ./gammacli-jsons/get-balance.json -signer " + userAccountOnOrbs + " -name " + orbsErc20ContractName + " -arg1 " + userAccountOnOrbs)
	out := struct {
		OutputArguments []*struct {
			Value string
		}
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	n, _ := strconv.ParseUint(out.OutputArguments[0].Value, 10, 32)
	return int(n)
}

func (gc *gammaCliAdapter) GenerateReceiptProof(orbsTxId string) (packedOrbsReceiptProof string, packedOrbsReceipt string) {
	bytes := gc.run("tx-proof " + orbsTxId)
	out := struct {
		PackedProof   string
		PackedReceipt string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out.PackedProof, out.PackedReceipt
}

func (gc *gammaCliAdapter) OrbsUserIdToHexAddress(orbsUserId string) (userAccountOnOrbsHex string) {
	file, err := ioutil.ReadFile("orbs-test-keys.json")
	if err != nil {
		panic(err.Error())
	}
	type Key struct {
		PrivateKey []byte
		PublicKey  []byte
		Address    string // base58
	}
	keys := make(map[string]*Key)
	json.Unmarshal(file, &keys)
	key, found := keys[orbsUserId]
	if !found {
		panic("UserId " + orbsUserId + " not found in orbs-test-keys.json")
	}
	return key.Address
}

func (gc *gammaCliAdapter) run(args string, env ...string) []byte {
	args += " -env " + gc.env
	if gc.debug {
		fmt.Println("\n  ### RUNNING: gamma-cli " + args)
		if len(env) > 0 {
			fmt.Printf("      ENV: %+v", env)
		}
		fmt.Printf("\n  ### OUTPUT:\n\n")
	}
	argsArr := strings.Split(args, " ")
	cmd := exec.Command("gamma-cli", argsArr...)
	var out []byte
	var err error
	if gc.debug {
		out, err = combinedOutputWithStdoutPipe(cmd)
	} else {
		out, err = cmd.CombinedOutput()
	}
	if err != nil {
		panic(err.Error() + "\n" + string(out))
	}
	return out
}
