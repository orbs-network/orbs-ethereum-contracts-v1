package driver

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
)

func AdapterForTruffleGanache(config *Config) EthereumAdapter {
	return &truffleAdapter{
		debug:       config.DebugLogs,
		projectPath: ".",
		network:     "ganache",
	}
}

func AdapterForTruffleRopsten(config *Config) EthereumAdapter {
	return &truffleAdapter{
		debug:       config.DebugLogs,
		projectPath: ".",
		network:     "ropsten",
	}
}

type truffleAdapter struct {
	debug       bool
	projectPath string
	network     string
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

func (ta *truffleAdapter) DeployASBContract(ethereumErc20Address string, orbsAsbContractName string) (ethereumAsbAddress string) {
	ta.run("migrate --reset",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"ORBS_ASB_CONTRACT_NAME="+orbsAsbContractName,
	)
	return ta.GetASBContractAddress()
}

func (ta *truffleAdapter) GetASBContractAddress() (ethereumAsbAddress string) {
	bytes := ta.run("exec ./truffle-scripts/getASBAddress.js")
	out := struct {
		Address string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out.Address
}

func (ta *truffleAdapter) FundUserAccount(ethereumErc20Address string, userAccountOnEthereum string, userInitialBalanceOnEthereum int) (userBalanceOnEthereumAfter int) {
	ta.run("exec ./truffle-scripts/assign.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
		"USER_INITIAL_BALANCE_ON_ETHEREUM="+fmt.Sprintf("%d", userInitialBalanceOnEthereum),
	)
	return ta.GetBalance(ethereumErc20Address, userAccountOnEthereum)
}

func (ta *truffleAdapter) WaitForFinality() {
	ta.run("exec ./truffle-scripts/makeFinal.js")
}

func (ta *truffleAdapter) TransferOut(ethereumErc20Address string, userAccountOnEthereum string, userAccountOnOrbs string, userTransferAmount int) (ethereumTxHash string, userBalanceOnEthereumAfter int) {
	ta.run("exec ./truffle-scripts/approve.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
		"USER_TRANSFER_AMOUNT="+fmt.Sprintf("%d", userTransferAmount),
	)
	ta.run("exec ./truffle-scripts/allowance.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
	)
	bytes := ta.run("exec ./truffle-scripts/transferOut.js",
		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
		"USER_ACCOUNT_ON_ORBS="+userAccountOnOrbs,
		"USER_TRANSFER_AMOUNT="+fmt.Sprintf("%d", userTransferAmount),
	)
	out := struct {
		TxHash string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	ta.run("exec ./truffle-scripts/allowance.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
	)
	return out.TxHash, ta.GetBalance(ethereumErc20Address, userAccountOnEthereum)
}

func (ta *truffleAdapter) TransferIn(ethereumErc20Address string, userAccountOnEthereum string, packedOrbsReceiptProof string, packedOrbsReceipt string) (ethereumTxHash string, userBalanceOnEthereumAfter int) {
	bytes := ta.run("exec ./truffle-scripts/transferIn.js",
		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
		"PACKED_ORBS_RECEIPT_PROOF="+packedOrbsReceiptProof,
		"PACKED_ORBS_RECEIPT="+packedOrbsReceipt,
	)
	out := struct {
		TxHash string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out.TxHash, ta.GetBalance(ethereumErc20Address, userAccountOnEthereum)
}

func (ta *truffleAdapter) GetBalance(ethereumErc20Address string, userAccountOnEthereum string) (userBalanceOnEthereum int) {
	bytes := ta.run("exec ./truffle-scripts/getBalance.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
	)
	out := struct {
		Balance string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	n, _ := strconv.ParseUint(out.Balance, 16, 32)
	return int(n)
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
