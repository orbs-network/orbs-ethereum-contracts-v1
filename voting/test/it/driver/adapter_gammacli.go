package driver

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

func AdapterForGammaCliLocal(config *Config) OrbsAdapter {
	return &gammaCliAdapter{
		debug:                   config.DebugLogs,
		env:                     "experimental", // use "local" for the stable local gamma-cli ... or for client tests
		stakeFactor:             10000,
		voteMirrorPeriod:        10,
		voteValidPeriod:         500,
		electionPeriod:          200,
		maxElectedValidators:    5,
		finalityBlocksComponent: 1,
		finalityTimeComponent:   10 * time.Second,
	}
}

func AdapterForGammaCliTestnet(config *Config) OrbsAdapter {
	return &gammaCliAdapter{
		debug: config.DebugLogs,
		env:   "integrative",
		stakeFactor:             10000,
		voteMirrorPeriod:        15,
		voteValidPeriod:         500,
		electionPeriod:          200,
		maxElectedValidators:    10,
		finalityBlocksComponent: 1,
		finalityTimeComponent:   2 * time.Minute + 5 * time.Second,
	}
}

type gammaCliAdapter struct {
	debug                   bool
	env                     string
	stakeFactor             uint64
	voteMirrorPeriod        uint64
	voteValidPeriod         uint64
	electionPeriod          uint64
	maxElectedValidators    int
	finalityBlocksComponent int
	finalityTimeComponent   time.Duration
}

func (gamma *gammaCliAdapter) DeployContract(orbsVotingContractName string) {
	gamma.run("deploy ./../../orbs/OrbsVoting/orbs_voting_contract.go -name " + orbsVotingContractName + " -signer user1")
}

func (gamma *gammaCliAdapter) SetContractConstants(orbsVotingContractName string) {
	gamma.run("send-tx ./gammacli-jsons/set-variables.json -signer user1 -name " + orbsVotingContractName +
		" -arg1 " + fmt.Sprintf("%d", gamma.stakeFactor) +
		" -arg2 " + fmt.Sprintf("%d", gamma.voteMirrorPeriod) +
		" -arg3 " + fmt.Sprintf("%d", gamma.voteValidPeriod) +
		" -arg4 " + fmt.Sprintf("%d", gamma.electionPeriod) +
		" -arg5 " + fmt.Sprintf("%d", gamma.maxElectedValidators))
}

func (gamma *gammaCliAdapter) BindERC20ContractToEthereum(orbsVotingContractName string, ethereumErc20Address string) {
	gamma.run("send-tx ./gammacli-jsons/set-token-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumErc20Address)
}

func (gamma *gammaCliAdapter) BindValidatorsContractToEthereum(orbsVotingContractName string, ethereumValidatorsAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-validators-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumValidatorsAddress)
}

func (gamma *gammaCliAdapter) BindValidatorsRegistryContractToEthereum(orbsVotingContractName string, ethereumValidatorsRegistryAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-validators-registry-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumValidatorsRegistryAddress)
}

func (gamma *gammaCliAdapter) BindVotingContractToEthereum(orbsVotingContractName string, ethereumVotingAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-voting-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumVotingAddress)
}

func (gamma *gammaCliAdapter) BindGuardiansContractToEthereum(orbsVotingContractName string, ethereumGuardiansAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-guardians-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumGuardiansAddress)
}

func (gamma *gammaCliAdapter) SetFirstElectionBlockNumber(orbsVotingContractName string, blockHeight int) {
	gamma.run("send-tx ./gammacli-jsons/set-first-election.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + fmt.Sprintf("%d", blockHeight))
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

func (gamma *gammaCliAdapter) ForwardElectionResultsToSystem(electedValidatorAddresses []string) {
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

func (gamma *gammaCliAdapter) GetCurrentSystemBlockSigners() []string {
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
		ProofSigners []string
	}{}
	err = json.Unmarshal(bytes, &out2)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out2.ProofSigners
}

func (gamma *gammaCliAdapter) GetFinalityBlocksComponent() int {
	return gamma.finalityBlocksComponent
}

func (gamma *gammaCliAdapter) GetFinalityTimeComponent() time.Duration {
	return gamma.finalityTimeComponent
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
