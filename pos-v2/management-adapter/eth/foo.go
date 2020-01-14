package eth

import (
	"bytes"
	"context"
	"encoding/json"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/pkg/errors"
	"math/big"
)

type Adapter struct {
	contractAddresses []common.Address
}

type CommitteeChanged struct {
	Addrs  []common.Address `json:"addrs"`
	Stakes []*big.Int       `json:"stakes"`
}

const posAbi = `[{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"isOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_maxCommitteeSize","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"addr","type":"address"},{"indexed":false,"name":"ip","type":"bytes4"}],"name":"ValidatorRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"addrs","type":"address[]"},{"indexed":false,"name":"stakes","type":"uint256[]"}],"name":"CommitteeChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"from","type":"address"},{"indexed":false,"name":"to","type":"address"}],"name":"Delegated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"addr","type":"address"},{"indexed":false,"name":"newTotal","type":"uint256"}],"name":"TotalStakeChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"setStakingContract","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"ip","type":"bytes4"}],"name":"registerValidator","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"}],"name":"delegate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"staker","type":"address"},{"name":"amount","type":"uint256"}],"name":"staked","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"staker","type":"address"},{"name":"amount","type":"uint256"}],"name":"unstaked","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]`

func NewEthereumAdapter(contractAddresses []common.Address) *Adapter {
	return &Adapter{contractAddresses: contractAddresses}
}

func (a *Adapter) GetCommittee(ctx context.Context, asOfBlock int64) ([]byte, error) {
	url := "http://localhost:7545"
	client, err := ethclient.Dial(url)
	if err != nil {
		return nil, errors.Wrapf(err, "failed connecting to the Ethereum node at %s", url)
	}

	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(asOfBlock),
		ToBlock:   big.NewInt(asOfBlock),
		Addresses: a.contractAddresses,
	}

	logs, err := client.FilterLogs(ctx, query)
	if err != nil {
		return nil, errors.Wrapf(err, "failed querying logs using query %s", query)
	}

	event, err := parseEvent(logs[1].Data)
	if err != nil {
		return nil, err
	}

	return json.Marshal(event)
}

func parseEvent(raw []byte) (*CommitteeChanged, error) {
	parsedABI, err := abi.JSON(bytes.NewReader([]byte(posAbi)))
	if err != nil {
		return nil, errors.Wrapf(err, "failed to parse abi")
	}
	event := &CommitteeChanged{}
	err = parsedABI.Events["CommitteeChanged"].Inputs.Unpack(event, raw)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to unpack event")
	}
	return event, nil
}
