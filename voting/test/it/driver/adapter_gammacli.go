package driver

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

func NewGammaCliAdapter(
	debug bool,
	env string,
	stakeFactor uint64,
	voteMirrorPeriod uint64,
	voteValidPeriod uint64,
	electionPeriod uint64,
	maxElectedValidators int,
	minElectedValidators int,
	finalityBlocksComponent int,
	finalityTimeComponent time.Duration,
) *GammaCliAdapter {
	return &GammaCliAdapter{
		debug:                   debug,
		env:                     env,
		stakeFactor:             stakeFactor,
		voteMirrorPeriod:        voteMirrorPeriod,
		voteValidPeriod:         voteValidPeriod,
		electionPeriod:          electionPeriod,
		maxElectedValidators:    maxElectedValidators,
		minElectedValidators:    minElectedValidators,
		finalityBlocksComponent: finalityBlocksComponent,
		finalityTimeComponent:   finalityTimeComponent,
	}
}

type GammaCliAdapter struct {
	debug                   bool
	env                     string
	stakeFactor             uint64
	voteMirrorPeriod        uint64
	voteValidPeriod         uint64
	electionPeriod          uint64
	maxElectedValidators    int
	minElectedValidators    int
	finalityBlocksComponent int
	finalityTimeComponent   time.Duration
}

func (gamma *GammaCliAdapter) DeployContract(orbsVotingContractName string) string {
	if orbsVotingContractName == "" {
		orbsVotingContractName = fmt.Sprintf("OrbsVoting_%d", time.Now().Unix())
	}
	gamma.run("deploy ./../../orbs/OrbsVoting/orbs_voting_contract.go -name " + orbsVotingContractName + " -signer user1")
	return orbsVotingContractName
}

func (gamma *GammaCliAdapter) SetContractConstants(orbsVotingContractName string) {
	gamma.run("send-tx ./gammacli-jsons/set-variables.json -signer user1 -name " + orbsVotingContractName +
		" -arg1 " + fmt.Sprintf("%d", gamma.stakeFactor) +
		" -arg2 " + fmt.Sprintf("%d", gamma.voteMirrorPeriod) +
		" -arg3 " + fmt.Sprintf("%d", gamma.voteValidPeriod) +
		" -arg4 " + fmt.Sprintf("%d", gamma.electionPeriod) +
		" -arg5 " + fmt.Sprintf("%d", gamma.maxElectedValidators) +
		" -arg6 " + fmt.Sprintf("%d", gamma.minElectedValidators))
}

func (gamma *GammaCliAdapter) BindERC20ContractToEthereum(orbsVotingContractName string, ethereumErc20Address string) {
	gamma.run("send-tx ./gammacli-jsons/set-token-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumErc20Address)
}

func (gamma *GammaCliAdapter) BindValidatorsContractToEthereum(orbsVotingContractName string, ethereumValidatorsAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-validators-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumValidatorsAddress)
}

func (gamma *GammaCliAdapter) BindValidatorsRegistryContractToEthereum(orbsVotingContractName string, ethereumValidatorsRegistryAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-validators-registry-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumValidatorsRegistryAddress)
}

func (gamma *GammaCliAdapter) BindVotingContractToEthereum(orbsVotingContractName string, ethereumVotingAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-voting-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumVotingAddress)
}

func (gamma *GammaCliAdapter) BindGuardiansContractToEthereum(orbsVotingContractName string, ethereumGuardiansAddress string) {
	gamma.run("send-tx ./gammacli-jsons/set-guardians-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumGuardiansAddress)
}

func (gamma *GammaCliAdapter) SetElectionBlockNumber(orbsVotingContractName string, blockHeight int) {
	gamma.run("send-tx ./gammacli-jsons/set-first-election.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + fmt.Sprintf("%d", blockHeight))
}

func (gamma *GammaCliAdapter) GetElectedNodes(orbsVotingContractName string) []string {
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

func (gamma *GammaCliAdapter) ForwardElectionResultsToSystem(electedValidatorAddresses []string) {
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

func (gamma *GammaCliAdapter) GetCurrentSystemBlockSigners() []string {
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

func (gamma *GammaCliAdapter) GetFinalityBlocksComponent() int {
	return gamma.finalityBlocksComponent
}

func (gamma *GammaCliAdapter) GetFinalityTimeComponent() time.Duration {
	return gamma.finalityTimeComponent
}

func (gamma *GammaCliAdapter) run(args string, env ...string) []byte {
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

func (gamma *GammaCliAdapter) GetStakeFactor() uint64 {
	return gamma.stakeFactor
}

func (gamma *GammaCliAdapter) GetMirrorVotingPeriod() int {
	return int(gamma.voteMirrorPeriod)
}

func (gamma *GammaCliAdapter) GetOrbsEnvironment() string {
	return gamma.env
}
