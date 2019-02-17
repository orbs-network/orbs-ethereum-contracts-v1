package driver

import (
	"encoding/json"
	"fmt"
	"github.com/stretchr/testify/require"
	"os"
	"os/exec"
	"strings"
	"testing"
)

func RunMirrorFlow(t *testing.T, config *Config, orbs OrbsAdapter, ethereum EthereumAdapter) {

	require.NoError(t, config.Validate(false))
	na := NodeAdater(config)

	logStage("Running script to find Delegate Transfer Events ...")
	bytes := na.run("node-scripts/generateDelegateByTransfer.js",
		"NETWORK_URL_ON_ETHEREUM="+na.etherumUrl,
		"ERC20_CONTRACT_ADDRESS="+config.EthereumErc20Address,
		"START_BLOCK_ON_ETHEREUM="+fmt.Sprintf("%d", ethereum.GetStartOfHistoryBlock()),
		"END_BLOCK_ON_ETHEREUM="+fmt.Sprintf("%d", ethereum.GetCurrentBlock()),
	)

	var out []delegateByTransferData
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}

	// TODO v1 calculate how many delegate transfer, which to/from -- issue i hold index and not address ??
	require.Equal(t, 8, len(out), "should be 8 transfer txs")
	logStageDone("Delegate Transfer events = %v", out)

	logStage("Mirroring Delegate Transfer Events ...")
	for _, dt := range out {
		orbs.MirrorDelegateByTransfer(getOrbsVotingContractName(), dt.TxHash, dt.Block)
	}
	logStageDone("Mirroring Delegate Transfer")

	logSummary("Mirror Phase all done.\n\n")

}

type delegateByTransferData struct {
	Block            int
	TransactionIndex int
	TxHash           string
	DelegatorAddress string
	DelegateeAddress string
	Medthod          string
}

func NodeAdater(config *Config) *nodeAdapter {
	return &nodeAdapter{
		debug:       config.DebugLogs,
		projectPath: ".",
		//		etherumUrl:  "'http://13.209.220.37:8545/'",
		etherumUrl: "http://localhost:7545/",
	}
}

type nodeAdapter struct {
	debug       bool
	projectPath string
	etherumUrl  string
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
