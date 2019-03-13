package driver

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

func AdapterForTruffleGanache(config *Config, stakeFactor uint64) EthereumAdapter {
	return &truffleAdapter{
		debug:       config.DebugLogs,
		projectPath: ".",
		network:     "ganache",
		networkUrl:  "http://127.0.0.1:7545",
		startBlock:  0,
		stakeFactor: stakeFactor,
	}
}

func AdapterForTruffleRopsten(config *Config, stakeFactor uint64) EthereumAdapter {
	return &truffleAdapter{
		debug:       config.DebugLogs,
		projectPath: ".",
		network:     "ropsten",
		networkUrl:  "http://127.0.0.1:7545",
		startBlock:  400000,
		stakeFactor: stakeFactor,
	}
}

type truffleAdapter struct {
	debug       bool
	projectPath string
	network     string
	networkUrl  string
	startBlock  int
	stakeFactor uint64
}

func (ta *truffleAdapter) GetStartOfHistoryBlock() int {
	return ta.startBlock
}

func (ta *truffleAdapter) GetCurrentBlock() int {
	bytesOutput := ta.run("exec ./truffle-scripts/getCurrentBlock.js")
	out := struct {
		CurrentBlock int
	}{}
	err := json.Unmarshal(bytesOutput, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytesOutput))
	}
	return out.CurrentBlock
}

func (ta *truffleAdapter) DeployERC20Contract() (ethereumErc20Address string) {
	bytes := ta.run("exec ./truffle-scripts/deployERC20.js")
	out := struct {
		Address string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out.Address
}

func (ta *truffleAdapter) GetStakes(ethereumErc20Address string, numberOfStakes int) []int {
	bytes := ta.run("exec ./truffle-scripts/getStakes.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"NUMBER_OF_STAKEHOLDERS_ETHEREUM="+fmt.Sprintf("%d", numberOfStakes),
	)
	out := struct {
		Balances []string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	response := make([]int, len(out.Balances))
	for i, v := range out.Balances {
		n, _ := strconv.ParseUint(v, 16, 32)
		response[i] = ta.fromEthereumToken(n)
	}
	return response
}

func (ta *truffleAdapter) SetStakes(ethereumErc20Address string, stakes []int) {
	ethStakes := make([]uint64, len(stakes))
	for i, v := range stakes {
		ethStakes[i] = ta.toEthereumToken(v) + 10*STAKE_TOKEN_DELEGATE_VALUE
	}
	out, _ := json.Marshal(ethStakes)

	ta.run("exec ./truffle-scripts/fundStakes.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"ACCOUNT_STAKES_ON_ETHEREUM="+string(out),
	)
}

func (ta *truffleAdapter) Transfer(ethereumErc20Address string, from int, to int, amount int) {
	var tokens uint64
	if amount == 0 {
		tokens = STAKE_TOKEN_DELEGATE_VALUE
	} else {
		tokens = ta.toEthereumToken(amount)
	}
	ta.run("exec ./truffle-scripts/transfer.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"FROM_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", from),
		"TO_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", to),
		"TRANSFER_AMOUNT="+fmt.Sprintf("%d", tokens),
	)
}

func (ta *truffleAdapter) DeployValidatorsContract() (ethereumValidatorsAddress string, ethereumValidatorsRegAddress string) {
	bytes := ta.run("exec ./truffle-scripts/deployValidators.js")
	out := struct {
		ValidatorsAddress         string
		ValidatorsRegistryAddress string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out.ValidatorsAddress, out.ValidatorsRegistryAddress
}

func (ta *truffleAdapter) GetValidators(ethereumValidatorsAddress string) []string {
	bytes := ta.run("exec ./truffle-scripts/getValidators.js",
		"VALIDATORS_CONTRACT_ADDRESS="+ethereumValidatorsAddress,
	)
	out := struct {
		Validators []string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out.Validators
}

func (ta *truffleAdapter) TopUpEther(accountIndexes []int) {
	accountIndexesJson, _ := json.Marshal(accountIndexes)
	ta.run("exec ./truffle-scripts/topUpEther.js",
		"ACCOUNT_INDEXES_ON_ETHEREUM="+string(accountIndexesJson),
	)
}

func (ta *truffleAdapter) SetValidators(ethereumValidatorsAddress string, ethereumValidatorsRegAddress string, validators []int, orbsAddresses []string, orbsIps []string) {
	validatorsJson, _ := json.Marshal(validators)
	orbsAddressesJson, _ := json.Marshal(orbsAddresses)
	orbsIpsJson, _ := json.Marshal(orbsIps)
	ta.run("exec ./truffle-scripts/setValidators.js",
		"VALIDATORS_CONTRACT_ADDRESS="+ethereumValidatorsAddress,
		"VALIDATORS_REGISTRY_CONTRACT_ADDRESS="+ethereumValidatorsRegAddress,
		"VALIDATOR_ACCOUNT_INDEXES_ON_ETHEREUM="+string(validatorsJson),
		"VALIDATOR_ORBS_ADDRESSES="+string(orbsAddressesJson),
		"VALIDATOR_ORBS_IPS="+string(orbsIpsJson),
	)
}

func (ta *truffleAdapter) DeployVotingContract() (ethereumVotingAddress string) {
	bytes := ta.run("exec ./truffle-scripts/deployVoting.js")
	out := struct {
		Address string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out.Address
}

func (ta *truffleAdapter) Delegate(ethereumVotingAddress string, from int, to int) {
	ta.run("exec ./truffle-scripts/delegate.js",
		"VOTING_CONTRACT_ADDRESS="+ethereumVotingAddress,
		"FROM_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", from),
		"TO_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", to),
	)
}

func (ta *truffleAdapter) Vote(ethereumVotingAddress string, activistIndex int, candidates []int) {
	out, _ := json.Marshal(candidates)
	ta.run("exec ./truffle-scripts/vote.js",
		"VOTING_CONTRACT_ADDRESS="+ethereumVotingAddress,
		"ACTIVIST_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", activistIndex),
		"CANDIDATE_ACCOUNT_INDEXES_ON_ETHEREUM="+string(out),
	)
}

func (ta *truffleAdapter) DeployGuardiansContract() (ethereumGuardiansAddress string) {
	bytes := ta.run("exec ./truffle-scripts/deployGuardians.js")
	out := struct {
		Address string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out.Address
}

func (ta *truffleAdapter) SetGuardians(ethereumGuardiansAddress string, guardians []int) {
	out, _ := json.Marshal(guardians)
	ta.run("exec ./truffle-scripts/setGuardians.js",
		"GUARDIANS_CONTRACT_ADDRESS="+ethereumGuardiansAddress,
		"GUARDIAN_ACCOUNT_INDEXES_ON_ETHEREUM="+string(out),
	)
}

func (ta *truffleAdapter) WaitForBlock(blockNumber int) {
	if ta.network == "ganache" {
		blocksToMine := blockNumber - ta.GetCurrentBlock()
		if blocksToMine > 0 {
			ta.run("exec ./truffle-scripts/mine.js", "BLOCKS_TO_MINE="+fmt.Sprintf("%d", blocksToMine))
		}
	} else { // busy wait until block number is reached
		fmt.Printf("Waiting for block %d...\n", blockNumber)
		for cb := ta.GetCurrentBlock(); cb < blockNumber; cb = ta.GetCurrentBlock() {
			fmt.Printf("	current block is %d\n", cb)
			time.Sleep(1 * time.Second)
		}
	}
}

func (ta *truffleAdapter) run(args string, env ...string) []byte {
	args += " --network " + ta.network
	if ta.debug {
		fmt.Println("\n  ### RUNNING: truffle " + args)
		if len(env) > 0 {
			fmt.Printf("      ENV: %+v\n", env)
		}
		fmt.Printf("\n  ### OUTPUT:\n\n")
	}
	argsArr := strings.Split(args, " ")
	cmd := exec.Command("./node_modules/.bin/truffle", argsArr...)
	cmd.Dir = ta.projectPath
	cmd.Env = append(os.Environ(), env...)
	var out []byte
	var err error
	if ta.debug {
		out, err = combinedOutputWithStdoutPipe(cmd)
	} else {
		out, err = cmd.CombinedOutput()
	}
	if err != nil {
		panic(err.Error() + "\n" + string(out))
	}
	// remove first line of output (Using network...)
	index := bytes.IndexRune(out, '\n')
	return out[index:]
}

func (ta *truffleAdapter) fromEthereumToken(tokenValue uint64) int {
	return int(tokenValue / ta.stakeFactor)
}

func (ta *truffleAdapter) toEthereumToken(testValue int) uint64 {
	return uint64(testValue) * ta.stakeFactor
}

func (ta *truffleAdapter) GetConnectionUrl() string {
	ethereumUrl, result := os.LookupEnv("GANACHE_HOST")
	if result == false {
		return ta.networkUrl
	}
	return ethereumUrl
}
