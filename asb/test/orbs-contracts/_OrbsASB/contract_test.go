// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package main

import (
	orbsClient "github.com/orbs-network/orbs-client-sdk-go/orbsclient"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/safemath/safeuint64"
	. "github.com/orbs-network/orbs-contract-sdk/go/testing/unit"
	"github.com/stretchr/testify/require"
	"math/big"
	"testing"
)

func TestTransferIn_AllGood(t *testing.T) {
	txid := "cccc"

	orbsUserAddress := createOrbsAccount()

	InServiceScope(nil, nil, func(m Mockery) {
		_init() // start the asb contract // todo  v1 open bug
		// prepare
		m.MockEthereumLog(getAsbAddr(), getAsbAbi(), txid, "EthTransferredOut", 0, 0, func(out interface{}) {
			v := out.(*EthTransferredOut)
			v.Tuid = big.NewInt(42)
			v.To = orbsUserAddress
			v.Value = big.NewInt(17)

		})

		// this is what we expect to be called
		m.MockServiceCallMethod(getTokenContract(), "asbMint", nil, orbsUserAddress[:], uint64(17))

		// call
		transferIn(txid)

		// assert
		m.VerifyMocks()
		require.True(t, isInTuidExists(genInTuidKey(big.NewInt(42).Bytes())))
	})

}

func TestTransferIn_NoTuid(t *testing.T) {
	txid := "cccc"

	InServiceScope(nil, nil, func(m Mockery) {
		_init() // start the asb contract // todo  v1 open bug
		// prepare
		m.MockEthereumLog(getAsbAddr(), getAsbAbi(), txid, "EthTransferredOut", 0, 0, func(out interface{}) {
			v := out.(*EthTransferredOut)
			v.Tuid = nil
		})

		// call
		require.Panics(t, func() {
			transferIn(txid)
		}, "should panic because no tuid")
	})
}

func TestTransferIn_NoValue(t *testing.T) {
	txid := "cccc"

	InServiceScope(nil, nil, func(m Mockery) {
		_init() // start the asb contract // todo  v1 open bug
		// prepare
		m.MockEthereumLog(getAsbAddr(), getAsbAbi(), txid, "EthTransferredOut", 0, 0, func(out interface{}) {
			v := out.(*EthTransferredOut)
			v.Tuid = big.NewInt(42)
		})

		// call
		require.Panics(t, func() {
			transferIn(txid)
		}, "should panic because no value")
	})
}

func TestTransferIn_NegativeValue(t *testing.T) {
	txid := "cccc"

	InServiceScope(nil, nil, func(m Mockery) {
		_init() // start the asb contract // todo  v1 open bug
		// prepare
		m.MockEthereumLog(getAsbAddr(), getAsbAbi(), txid, "EthTransferredOut", 0, 0, func(out interface{}) {
			v := out.(*EthTransferredOut)
			v.Tuid = big.NewInt(42)
			v.Value = big.NewInt(-17)
		})

		// call
		require.Panics(t, func() {
			transferIn(txid)
		}, "should panic because negative value")
	})
}

func TestTransferIn_NoOrbsAddress(t *testing.T) {
	txid := "cccc"

	InServiceScope(nil, nil, func(m Mockery) {
		_init() // start the asb contract // todo  v1 open bug
		// prepare
		m.MockEthereumLog(getAsbAddr(), getAsbAbi(), txid, "EthTransferredOut", 0, 0, func(out interface{}) {
			v := out.(*EthTransferredOut)
			v.Tuid = big.NewInt(42)
			v.Value = big.NewInt(17)
		})

		// call
		require.Panics(t, func() {
			transferIn(txid)
		}, "should panic because no address")
	})
}

func TestTransferIn_TuidAlreadyUsed(t *testing.T) {
	txid := "cccc"

	orbsUserAddress := createOrbsAccount()

	InServiceScope(nil, nil, func(m Mockery) {
		_init() // start the asb contract // todo  v1 open bug
		setInTuid(genInTuidKey(big.NewInt(42).Bytes()))

		// prepare
		m.MockEthereumLog(getAsbAddr(), getAsbAbi(), txid, "EthTransferredOut", 0, 0, func(out interface{}) {
			v := out.(*EthTransferredOut)
			v.Tuid = big.NewInt(42)
			v.Value = big.NewInt(17)
			v.To = orbsUserAddress
		})

		// call
		require.Panics(t, func() {
			transferIn(txid)
		}, "should panic because no address")
	})
}

func TestTransferOut_AllGood(t *testing.T) {
	amount := uint64(17)
	ethAddr := AnAddress()

	orbsUserAddress := createOrbsAccount()

	InServiceScope(orbsUserAddress[:], nil, func(m Mockery) {
		_init() // start the asb contract // todo  v1 open bug

		// what is expected to be called
		tuid := safeuint64.Add(getOutTuid(), 1)
		m.MockEmitEvent(OrbsTransferredOut, tuid, orbsUserAddress[:], ethAddr, big.NewInt(17).Uint64())
		m.MockServiceCallMethod(getTokenContract(), "asbBurn", nil, orbsUserAddress[:], amount)

		// call
		transferOut(ethAddr, amount)

		// assert
		m.VerifyMocks()
		require.Equal(t, uint64(1), getOutTuid())
	})
}

func TestReset(t *testing.T) {
	maxOut := uint64(500)
	maxIn := int64(200)

	InServiceScope(nil, nil, func(m Mockery) {
		_init() // start the asb contracat

		setOutTuid(maxOut)
		for i := int64(0); i < maxIn; i++ {
			if i%54 == 0 {
				continue // just as not to have all of them
			}
			setInTuid(genInTuidKey(big.NewInt(i).Bytes()))
		}
		setInTuidMax(uint64(maxIn))

		// call
		resetContract()

		// assert
		require.Equal(t, uint64(0), getOutTuid())
		require.Equal(t, uint64(0), getInTuidMax())
		for i := int64(0); i < maxIn; i++ {
			require.False(t, isInTuidExists(genInTuidKey(big.NewInt(i).Bytes())), "tuid should be empty %d", i)
		}
	})
}

// TODO(v1): talkol - I will move this to be part of the test framework
func createOrbsAccount() [20]byte {
	orbsUser, err := orbsClient.CreateAccount()
	if err != nil {
		panic(err.Error())
	}
	var orbsUserAddress [20]byte
	copy(orbsUserAddress[:], orbsUser.RawAddress)
	return orbsUserAddress
}
