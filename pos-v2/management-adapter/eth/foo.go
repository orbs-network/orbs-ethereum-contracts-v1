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
	contractAddresses   []common.Address
	committeeChangedABI abi.ABI
	ethereumEndpoint    string
}

type CommitteeChanged struct {
	Addrs     []common.Address `json:"addrs"`
	OrbsAddrs []common.Address `json:"orbsAddrs"`
	Stakes    []*big.Int       `json:"stakes"`
}

const committeeChangedABIJSON = `[{
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "addrs",
          "type": "address[]"
        },
        {
          "indexed": false,
          "name": "orbsAddrs",
          "type": "address[]"
        },
        {
          "indexed": false,
          "name": "stakes",
          "type": "uint256[]"
        }
      ],
      "name": "CommitteeChanged",
      "type": "event"
    }]`

func NewEthereumAdapter(ethereumEndpoint string, contractAddresses []common.Address) *Adapter {
	parsedABI, err := abi.JSON(bytes.NewReader([]byte(committeeChangedABIJSON)))
	if err != nil {
		panic(errors.Wrapf(err, "failed to parse abi"))
	}
	return &Adapter{
		ethereumEndpoint:    ethereumEndpoint,
		contractAddresses:   contractAddresses,
		committeeChangedABI: parsedABI,
	}
}

func (a *Adapter) GetCommittee(ctx context.Context, asOfBlock int64) ([]byte, error) {
	client, err := ethclient.Dial(a.ethereumEndpoint)
	if err != nil {
		return nil, errors.Wrapf(err, "failed connecting to the Ethereum node at %s", a.ethereumEndpoint)
	}

	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(asOfBlock),
		ToBlock:   big.NewInt(asOfBlock),
		Addresses: a.contractAddresses,
		Topics:    [][]common.Hash{{a.committeeChangedABI.Events["CommitteeChanged"].ID()}},
	}

	logs, err := client.FilterLogs(ctx, query)
	if err != nil {
		return nil, errors.Wrapf(err, "failed querying logs using query %s", query)
	}

	event, err := a.parseEvent(logs[0].Data)
	if err != nil {
		return nil, err
	}

	return json.Marshal(event)
}

func (a *Adapter) parseEvent(raw []byte) (*CommitteeChanged, error) {
	event := &CommitteeChanged{}
	err := a.committeeChangedABI.Events["CommitteeChanged"].Inputs.Unpack(event, raw)
	if err != nil {
		return nil, errors.Wrapf(err, "failed to unpack event")
	}
	return event, nil
}
