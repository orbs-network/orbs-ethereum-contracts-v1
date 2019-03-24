// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

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

func NewTruffleAdapter(
	debug bool,
	projectPath string,
	network string,
	networkUrl string,
	startBlock int,
	stakeFactor uint64,
) *TruffleAdapter {
	return &TruffleAdapter{
		debug:       debug,
		projectPath: projectPath,
		network:     network,
		networkUrl:  networkUrl,
		startBlock:  startBlock,
		stakeFactor: stakeFactor,
	}
}

type TruffleAdapter struct {
	debug       bool
	projectPath string
	network     string
	networkUrl  string
	startBlock  int
	stakeFactor uint64
}

func (ta *TruffleAdapter) GetStartOfHistoryBlock() int {
	return ta.startBlock
}

func (ta *TruffleAdapter) GetCurrentBlock() int {
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

func (ta *TruffleAdapter) TopUpEther(accountIndexes []int) {
	accountIndexesJson, _ := json.Marshal(accountIndexes)
	ta.run("exec ./truffle-scripts/topUpEther.js",
		"ACCOUNT_INDEXES_ON_ETHEREUM="+string(accountIndexesJson),
	)
}

func (ta *TruffleAdapter) PrintBalances() {
	ta.run("exec ./truffle-scripts/printTotalBalance.js")
}

func (ta *TruffleAdapter) DeployERC20Contract() (ethereumErc20Address string) {
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

type accountStake struct {
	Index   int
	Balance string
}

func (ta *TruffleAdapter) GetStakes(ethereumErc20Address string, numberOfStakes int) map[int]int {
	bytes := ta.run("exec ./truffle-scripts/getStakes.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"NUMBER_OF_STAKEHOLDERS_ETHEREUM="+fmt.Sprintf("%d", numberOfStakes),
	)
	out := struct {
		Balances []accountStake
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	stakesData := make(map[int]int)
	for _, stake := range out.Balances {
		n, _ := strconv.ParseUint(stake.Balance, 16, 32)
		stakesData[stake.Index] = ta.fromEthereumToken(n)
	}
	return stakesData
}

func (ta *TruffleAdapter) SetStakes(ethereumErc20Address string, stakes []int) {
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

func (ta *TruffleAdapter) Transfer(ethereumErc20Address string, from int, to int, amount int) {
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

func (ta *TruffleAdapter) DeployValidatorsContract() (ethereumValidatorsAddress string, ethereumValidatorsRegAddress string) {
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

type validatorData struct {
	Index       int
	Address     string
	OrbsAddress string
}

func (ta *TruffleAdapter) GetValidators(ethereumValidatorsAddress string, ethereumValidatorsRegAddress string) []validatorData {
	bytes := ta.run("exec ./truffle-scripts/getValidators.js",
		"VALIDATORS_CONTRACT_ADDRESS="+ethereumValidatorsAddress,
		"VALIDATORS_REGISTRY_CONTRACT_ADDRESS="+ethereumValidatorsRegAddress,
	)
	out := struct {
		Validators []validatorData
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out.Validators
}

func (ta *TruffleAdapter) SetValidators(ethereumValidatorsAddress string, ethereumValidatorsRegAddress string, validators []int, orbsAddresses []string, orbsIps []string) {
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

func (ta *TruffleAdapter) DeployVotingContract() (ethereumVotingAddress string) {
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

func (ta *TruffleAdapter) Delegate(ethereumVotingAddress string, from int, to int) {
	ta.run("exec ./truffle-scripts/delegate.js",
		"VOTING_CONTRACT_ADDRESS="+ethereumVotingAddress,
		"FROM_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", from),
		"TO_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", to),
	)
}

func (ta *TruffleAdapter) Vote(ethereumVotingAddress string, activistIndex int, candidates []int) {
	out, _ := json.Marshal(candidates)
	ta.run("exec ./truffle-scripts/vote.js",
		"VOTING_CONTRACT_ADDRESS="+ethereumVotingAddress,
		"ACTIVIST_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", activistIndex),
		"CANDIDATE_ACCOUNT_INDEXES_ON_ETHEREUM="+string(out),
	)
}

func (ta *TruffleAdapter) DeployGuardiansContract() (ethereumGuardiansAddress string) {
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

func (ta *TruffleAdapter) SetGuardians(ethereumGuardiansAddress string, guardians []int) {
	out, _ := json.Marshal(guardians)
	ta.run("exec ./truffle-scripts/setGuardians.js",
		"GUARDIANS_CONTRACT_ADDRESS="+ethereumGuardiansAddress,
		"GUARDIAN_ACCOUNT_INDEXES_ON_ETHEREUM="+string(out),
	)
}

func (ta *TruffleAdapter) ResignGuardians(ethereumGuardiansAddress string, guardians []int) {
	out, _ := json.Marshal(guardians)
	ta.run("exec ./truffle-scripts/resignGuardians.js",
		"GUARDIANS_CONTRACT_ADDRESS="+ethereumGuardiansAddress,
		"GUARDIAN_ACCOUNT_INDEXES_ON_ETHEREUM="+string(out),
	)
}

func (ta *TruffleAdapter) WaitForBlock(blockNumber int) {
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

func (ta *TruffleAdapter) WaitForFinality() {
	ta.run("exec ./truffle-scripts/makeFinal.js")
}

func (ta *TruffleAdapter) run(args string, env ...string) []byte {
	var lastErr error
	for i := 0; i < 3; i++ { // retry loop

		out, err := ta._run(args, env...) // 1 attempt
		if err != nil {
			lastErr = err

			fmt.Printf("\nError in attempt #%d. (error: %s) \n\n", i, err)

			time.Sleep(5 * time.Second)
			continue
		}

		// success
		return out

	}
	panic(lastErr)
}

func (ta *TruffleAdapter) _run(args string, env ...string) ([]byte, error) {
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

	if index == -1 {
		return nil, fmt.Errorf("failed to find fist linefeed in output: %s", string(out))
	}

	return out[index:], nil
}

func (ta *TruffleAdapter) fromEthereumToken(tokenValue uint64) int {
	return int(tokenValue / ta.stakeFactor)
}

func (ta *TruffleAdapter) toEthereumToken(testValue int) uint64 {
	return uint64(testValue) * ta.stakeFactor
}

func (ta *TruffleAdapter) GetConnectionUrl() string {
	return ta.networkUrl
}
