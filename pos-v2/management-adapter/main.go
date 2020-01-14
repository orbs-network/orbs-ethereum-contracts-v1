package main

import (
	"context"
	"flag"
	"github.com/ethereum/go-ethereum/common"
	"github.com/orbs-network/orbs-ethereum-contracts/pos-v2/management-adapter/eth"
	"os"
	"strings"
)

func main() {
	blockFlag := flag.Int64("as-of-block", 0, "block number to read until")
	addressesFlag := flag.String("addresses", "", "addresses of contracts")
	ethereumEndpointFlag := flag.String("ethereum-endpoint", "http://localhost:7545", "Ethereum endpoint url")
	flag.Parse()

	addressesHex := strings.Split(*addressesFlag, ",")
	var contractsAddresses []common.Address
	for _, addrHex := range addressesHex {
		contractsAddresses = append(contractsAddresses, common.HexToAddress(addrHex))
	}

	a := eth.NewEthereumAdapter(*ethereumEndpointFlag, contractsAddresses)
	json, err := a.GetCommittee(context.Background(), *blockFlag)
	if err != nil {
		os.Stderr.WriteString(err.Error())
		os.Exit(1)
	}

	os.Stdout.Write(json)
}
