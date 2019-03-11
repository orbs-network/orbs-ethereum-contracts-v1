package driver

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"strconv"
	"strings"
)

func AdapterForGammaCliLocal(config *Config) OrbsAdapter {
	return &gammaCliAdapter{
		debug:                     config.DebugLogs,
		env:                       "experimental", // use "local" for the stable local gamma-cli ... or for client tests
		stakeFactor:               10000,
		voteMirrorPeriod:          3,
		voteValidPeriod:           500,
		electionPeriod:            200,
		numberOfElectedValidators: 3,
	}
}

func AdapterForGammaCliTestnet(config *Config) OrbsAdapter {
	return &gammaCliAdapter{
		debug:                     config.DebugLogs,
		env:                       "testnet",
		stakeFactor:               10000,
		voteMirrorPeriod:          3,
		voteValidPeriod:           500,
		electionPeriod:            200,
		numberOfElectedValidators: 3,
	}
}

type gammaCliAdapter struct {
	debug                     bool
	env                       string
	stakeFactor               uint64
	voteMirrorPeriod          uint64
	voteValidPeriod           uint64
	electionPeriod            uint64
	numberOfElectedValidators int
}

func (gamma *gammaCliAdapter) DeployContract(orbsVotingContractName string) {
	gamma.run("deploy ./../../orbs/_OrbsVoting/orbs_voting_contract.go -name " + orbsVotingContractName + " -signer user1")
}

func (gamma *gammaCliAdapter) SetContractConstants(orbsVotingContractName string) {
	gamma.run("send-tx ./gammacli-jsons/voting-set-variables.json -signer user1 -name " + orbsVotingContractName +
		" -arg1 " + fmt.Sprintf("%d", gamma.stakeFactor) +
		" -arg2 " + fmt.Sprintf("%d", gamma.voteMirrorPeriod) +
		" -arg3 " + fmt.Sprintf("%d", gamma.voteValidPeriod) +
		" -arg4 " + fmt.Sprintf("%d", gamma.electionPeriod) +
		" -arg5 " + fmt.Sprintf("%d", gamma.numberOfElectedValidators))
}

func (gamma *gammaCliAdapter) BindERC20ContractToEthereum(orbsVotingContractName string, ethereumErc20Address string) {
	gamma.run("send-tx ./gammacli-jsons/token-set-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumErc20Address)
}

func (gamma *gammaCliAdapter) BindValidatorsContractToEthereum(orbsVotingContractName string, ethereumValidatorsAddress string) {
	gamma.run("send-tx ./gammacli-jsons/validators-set-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumValidatorsAddress)
}

func (gamma *gammaCliAdapter) BindVotingContractToEthereum(orbsVotingContractName string, ethereumVotingAddress string) {
	gamma.run("send-tx ./gammacli-jsons/voting-set-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumVotingAddress)
}

func (gamma *gammaCliAdapter) SetFirstElectionBlockNumber(orbsVotingContractName string, blockHeight int) {
	gamma.run("send-tx ./gammacli-jsons/voting-set-first-election.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + fmt.Sprintf("%d", blockHeight))
}

func (gamma *gammaCliAdapter) GetDelegateData(orbsVotingContractName string, delegator string) (addr string, blockNumber uint64, txIndex uint32, method string) {
	bytes := gamma.run("run-query ./gammacli-jsons/get-delegate-data.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + delegator)
	out := struct {
		OutputArguments []*struct {
			Value string
		}
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	blockNumber, _ = strconv.ParseUint(out.OutputArguments[1].Value, 10, 32)
	txIndex64, _ := strconv.ParseUint(out.OutputArguments[2].Value, 10, 32)

	return out.OutputArguments[0].Value, blockNumber, uint32(txIndex64), out.OutputArguments[3].Value
}

func (gamma *gammaCliAdapter) GetElectedNodes(orbsVotingContractName string) []string {
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
		respose[i] = "0x" + out.OutputArguments[0].Value[i*40+2:(i+1)*40+2]
	}

	return respose
}

func (gamma *gammaCliAdapter) run(args string, env ...string) []byte {
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

func (gamma *gammaCliAdapter) GetStakeFactor() uint64 {
	return gamma.stakeFactor
}

func (gamma *gammaCliAdapter) GetMirrorVotingPeriod() int {
	return int(gamma.voteMirrorPeriod)
}

func (gamma *gammaCliAdapter) GetOrbsEnvironment() string {
	return gamma.env
}
