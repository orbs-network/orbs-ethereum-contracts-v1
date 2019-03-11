package driver

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func NodeAdater(config *Config) *nodeAdapter {
	return &nodeAdapter{
		debug:       config.DebugLogs,
		projectPath: "../../processor/",
	}
}

type nodeAdapter struct {
	debug       bool
	projectPath string
}

func (na *nodeAdapter) Process(orbsVotingContractName string, maxNumberOfTries int, gammaEnv string) {
	na.run("process.js",
		"ORBS_VOTING_CONTRACT_NAME="+orbsVotingContractName,
		"MAXIMUM_NUMBER_OF_TRIES="+fmt.Sprintf("%d", maxNumberOfTries),
		"VERBOUSE=true",
		"ORBS_ENVIRONMENT="+gammaEnv,
	)
}

func (na *nodeAdapter) Mirror(orbsVotingContractName string, ethereumErc20Address string, ethereumVotingAddress string, startBlock int, endBlock int, ethereumUrl string, gammaEnv string) {
	na.run("mirror.js",
		"ORBS_VOTING_CONTRACT_NAME="+orbsVotingContractName,
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"VOTING_CONTRACT_ADDRESS="+ethereumVotingAddress,
		"START_BLOCK_ON_ETHEREUM="+fmt.Sprintf("%d", startBlock),
		"END_BLOCK_ON_ETHEREUM="+fmt.Sprintf("%d", endBlock),
		"VERBOSE=true",
		"NETWORK_URL_ON_ETHEREUM="+ethereumUrl,
		"ORBS_ENVIRONMENT="+gammaEnv,
	)
}

func (na *nodeAdapter) run(args string, env ...string) []byte {
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
