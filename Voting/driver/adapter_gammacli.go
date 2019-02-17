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

func (gc *gammaCliAdapter) DeployContract(orbsVotingContractName string, orbsConfigContractName string) {
	gc.run("deploy ./orbs-contracts/_OrbsVoting/orbs_voting_contract.go -name " + orbsVotingContractName + " -signer user1")
	gc.run("deploy ./orbs-contracts/_OrbsConfig/orbs_config_contract.go -name " + orbsConfigContractName + " -signer user1")
}

func (gc *gammaCliAdapter) BindERC20ContractToEthereum(orbsVotingContractName string, ethereumErc20Address string) {
	gc.run("send-tx ./gammacli-jsons/token-set-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumErc20Address)
}

func (gc *gammaCliAdapter) BindValidatorsContractToEthereum(orbsVotingContractName string, ethereumValidatorsAddress string) {
	gc.run("send-tx ./gammacli-jsons/asb-set-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumValidatorsAddress)
}

func (gc *gammaCliAdapter) BindVotingContractToEthereum(orbsVotingContractName string, ethereumVotingAddress string) {
	gc.run("send-tx ./gammacli-jsons/asb-set-address.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + ethereumVotingAddress)
}

func (gc *gammaCliAdapter) MirrorDelegateByTransfer(orbsVotingContractName string, transferTransactionHash string, transferBlockNumber int) {
	blockNumber := fmt.Sprintf("%d", transferBlockNumber)
	gc.run("send-tx ./gammacli-jsons/mirror-transfer.json -signer user1 -name " + orbsVotingContractName + " -arg1 " + transferTransactionHash + " -arg2 " + blockNumber)
}

func (gc *gammaCliAdapter) RunVotingProcess(orbsVotingContractName string) bool {
	bytes := gc.run("run-query ./gammacli-jsons/process-voting.json -signer user1 -name " + orbsVotingContractName)
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
	return n != 0
}

func (gc *gammaCliAdapter) GetElectedNodes(orbsConfigContractName string, blockHeight int) []string {
	bytes := gc.run("run-query ./gammacli-jsons/get-elected.json -signer user1 -name " + orbsConfigContractName + " -arg1 " + fmt.Sprintf("%d", blockHeight))
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
