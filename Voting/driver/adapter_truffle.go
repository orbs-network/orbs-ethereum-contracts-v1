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
		startBlock:  0,
	}
}

func AdapterForTruffleRopsten(config *Config) EthereumAdapter {
	return &truffleAdapter{
		debug:       config.DebugLogs,
		projectPath: ".",
		network:     "ropsten",
		startBlock:  400000,
	}
}

type truffleAdapter struct {
	debug       bool
	projectPath string
	network     string
	startBlock  int
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
	//n, _ := strconv.ParseUint(out.CurrentBlock, 16, 32)
	//return int(n)
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

func (ta *truffleAdapter) DeployValidatorsContract() (ethereumValidatorsAddress string) {
	bytes := ta.run("exec ./truffle-scripts/deployValidators.js")
	out := struct {
		Address string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	return out.Address
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

//func (ta *truffleAdapter) DeployASBContract(ethereumErc20Address string, orbsAsbContractName string) (ethereumAsbAddress string) {
//	ta.run("migrate --reset",
//		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
//		"ORBS_ASB_CONTRACT_NAME="+orbsAsbContractName,
//	)
//	return ta.GetASBContractAddress()
//}
//

func (ta *truffleAdapter) FundStakeAccount(ethereumErc20Address string, userAccountIndexOnEthereum int, userInitialBalanceOnEthereum int) (userBalanceOnEthereumAfter int) {
	amountToFund := toEthereumToken(userInitialBalanceOnEthereum) + 10*STAKE_TOKEN_DELEGATE_VALUE

	ta.run("exec ./truffle-scripts/fundstakes.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"USER_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", userAccountIndexOnEthereum),
		"USER_INITIAL_BALANCE_ON_ETHEREUM="+fmt.Sprintf("%d", amountToFund),
	)
	return ta.GetBalanceByIndex(ethereumErc20Address, userAccountIndexOnEthereum)
}

func (ta *truffleAdapter) AddValidatorAccount(ethereumValidatorAddress string, validatorAccountOnEthereum string) {
	ta.run("exec ./truffle-scripts/addValidator.js",
		"VALIDATORS_CONTRACT_ADDRESS="+ethereumValidatorAddress,
		"VALIDATORS_ACCOUNT_ON_ETHEREUM="+validatorAccountOnEthereum,
	)
}

func (ta *truffleAdapter) TransferFundsAccount(ethereumErc20Address string, from int, to int, amount int) {
	var tokens uint64
	if amount == 0 {
		tokens = STAKE_TOKEN_DELEGATE_VALUE
	} else {
		tokens = toEthereumToken(amount)
	}
	ta.run("exec ./truffle-scripts/transfer.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"FROM_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", from),
		"TO_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", to),
		"TRANSFER_AMOUNT="+fmt.Sprintf("%d", tokens),
	)
}

//func (ta *truffleAdapter) TransferOut(ethereumErc20Address string, userAccountOnEthereum string, userAccountOnOrbs string, userTransferAmount int) (ethereumTxHash string, userBalanceOnEthereumAfter int) {
//	ta.run("exec ./truffle-scripts/approve.js",
//		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
//		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
//		"USER_TRANSFER_AMOUNT="+fmt.Sprintf("%d", userTransferAmount),
//	)
//	ta.run("exec ./truffle-scripts/allowance.js",
//		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
//		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
//	)
//	bytes := ta.run("exec ./truffle-scripts/transferOut.js",
//		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
//		"USER_ACCOUNT_ON_ORBS="+userAccountOnOrbs,
//		"USER_TRANSFER_AMOUNT="+fmt.Sprintf("%d", userTransferAmount),
//	)
//	out := struct {
//		TxHash string
//	}{}
//	err := json.Unmarshal(bytes, &out)
//	if err != nil {
//		panic(err.Error() + "\n" + string(bytes))
//	}
//	ta.run("exec ./truffle-scripts/allowance.js",
//		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
//		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
//	)
//	return out.TxHash, ta.GetBalance(ethereumErc20Address, userAccountOnEthereum)
//}
//
//func (ta *truffleAdapter) TransferIn(ethereumErc20Address string, userAccountOnEthereum string, packedOrbsReceiptProof string, packedOrbsReceipt string) (ethereumTxHash string, userBalanceOnEthereumAfter int) {
//	bytes := ta.run("exec ./truffle-scripts/transferIn.js",
//		"USER_ACCOUNT_ON_ETHEREUM="+userAccountOnEthereum,
//		"PACKED_ORBS_RECEIPT_PROOF="+packedOrbsReceiptProof,
//		"PACKED_ORBS_RECEIPT="+packedOrbsReceipt,
//	)
//	out := struct {
//		TxHash string
//	}{}
//	err := json.Unmarshal(bytes, &out)
//	if err != nil {
//		panic(err.Error() + "\n" + string(bytes))
//	}
//	return out.TxHash, ta.GetBalance(ethereumErc20Address, userAccountOnEthereum)
//}

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
	return fromEthereumToken(n)
}

func (ta *truffleAdapter) GetBalanceByIndex(ethereumErc20Address string, userAccountIndexOnEthereum int) (userBalanceOnEthereum int) {
	bytes := ta.run("exec ./truffle-scripts/getBalanceByIndex.js",
		"ERC20_CONTRACT_ADDRESS="+ethereumErc20Address,
		"USER_ACCOUNT_INDEX_ON_ETHEREUM="+fmt.Sprintf("%d", userAccountIndexOnEthereum),
	)
	out := struct {
		Balance string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		panic(err.Error() + "\n" + string(bytes))
	}
	n, _ := strconv.ParseUint(out.Balance, 16, 32)
	return fromEthereumToken(n)
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
