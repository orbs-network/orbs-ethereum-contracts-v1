package driver

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func NodeAdater(config *Config) *nodeAdapter {
	ethereumUrl, result := os.LookupEnv("GANACHE_HOST")
	if result == false {
		ethereumUrl = "http://localhost:7545/"
	}

	return &nodeAdapter{
		debug:       config.DebugLogs,
		projectPath: ".",
		etherumUrl:  ethereumUrl,
	}
}

type nodeAdapter struct {
	debug       bool
	projectPath string
	etherumUrl  string
}

type delegateByTransferData struct {
	Block            int
	TransactionIndex int
	TxHash           string
	DelegatorAddress string
	DelegateeAddress string
	Method           string
}

func (na *nodeAdapter) FindDelegateByTransferEvents(ethereumErc20Address string, startBlock int, endBlock int) []delegateByTransferData {
	bytes := na.run("node-scripts/findDelegateByTransferEvents.js",
		"NETWORK_URL_ON_ETHEREUM="+na.etherumUrl,
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"START_BLOCK_ON_ETHEREUM="+fmt.Sprintf("%d", startBlock),
		"END_BLOCK_ON_ETHEREUM="+fmt.Sprintf("%d", endBlock),
	)
	var out []delegateByTransferData
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out
}

type delegateData struct {
	Block            int
	TransactionIndex int
	TxHash           string
	DelegatorAddress string
	DelegateeAddress string
	Method           string
}

func (na *nodeAdapter) FindDelegateEvents(ethereumVotingAddress string, startBlock int, endBlock int) []delegateData {
	bytes := na.run("node-scripts/findDelegateEvents.js",
		"NETWORK_URL_ON_ETHEREUM="+na.etherumUrl,
		"VOTING_CONTRACT_ADDRESS="+ethereumVotingAddress,
		"START_BLOCK_ON_ETHEREUM="+fmt.Sprintf("%d", startBlock),
		"END_BLOCK_ON_ETHEREUM="+fmt.Sprintf("%d", endBlock),
	)
	var out []delegateData
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out
}

type voteData struct {
	Block              int
	TransactionIndex   int
	TxHash             string
	ActivistAddress    string
	CandidateAddresses []string
	Method             string
}

func (na *nodeAdapter) FindVoteEvents(ethereumVotingAddress string, startBlock int, endBlock int) []voteData {
	bytes := na.run("node-scripts/findVoteEvents.js",
		"NETWORK_URL_ON_ETHEREUM="+na.etherumUrl,
		"VOTING_CONTRACT_ADDRESS="+ethereumVotingAddress,
		"START_BLOCK_ON_ETHEREUM="+fmt.Sprintf("%d", startBlock),
		"END_BLOCK_ON_ETHEREUM="+fmt.Sprintf("%d", endBlock),
	)
	var out []voteData
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out
}

func (na *nodeAdapter) run(args string, env ...string) []byte {
	//	args += " --network " + ta.network
	if na.debug {
		fmt.Println("\n  ### RUNNING: node " + args)
		if len(env) > 0 {
			fmt.Printf("      ENV: %+v\n", env)
		}
		fmt.Printf("\n  ### OUTPUT:\n\n")
	}
	argsArr := strings.Split(args, " ")
	cmd := exec.Command("node", argsArr...)
	cmd.Dir = na.projectPath
	cmd.Env = append(os.Environ(), env...)
	var out []byte
	var err error
	if na.debug {
		out, err = combinedOutputWithStdoutPipe(cmd)
	} else {
		out, err = cmd.CombinedOutput()
	}
	if err != nil {
		panic(err.Error() + "\n" + string(out))
	}
	return out
}
