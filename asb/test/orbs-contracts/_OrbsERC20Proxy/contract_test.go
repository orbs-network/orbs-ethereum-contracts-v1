// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package main

import (
	orbsClient "github.com/orbs-network/orbs-client-sdk-go/orbs"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
	. "github.com/orbs-network/orbs-contract-sdk/go/testing/unit"
	"github.com/orbs-network/orbs-ethereum-contracts/asb/test/test"
	"github.com/stretchr/testify/require"
	"testing"
)

func TestBalance_AllGood(t *testing.T) {
	userHave := uint64(55)
	owner := createOrbsAddress()

	InServiceScope(owner, nil, func(m Mockery) {
		state.WriteUint64(owner, userHave)
		// call
		balance := test.balanceOf(owner)
		require.Equal(t, userHave, balance)
	})
}

func TestBalance_WrongGoodAddress(t *testing.T) {
	owner := createOrbsAddress()

	InServiceScope(owner, nil, func(m Mockery) {
		// call
		balance := test.balanceOf(owner)
		require.Equal(t, uint64(0), balance)
	})
}

func TestBalance_BadAddress(t *testing.T) {
	owner := createOrbsAddress()

	InServiceScope(owner, nil, func(m Mockery) {
		// call
		require.Panics(t, func() {
			test.balanceOf([]byte{0, 0, 4, 5})
		}, "should panic bad address")
	})
}

func TestTransfer_BadAddress(t *testing.T) {
	owner := createOrbsAddress()

	InServiceScope(owner, nil, func(m Mockery) {
		// call
		require.Panics(t, func() {
			test.transfer([]byte{0, 0, 4, 5}, 10)
		}, "should panic bad address")
	})

}

func TestTransferImpl_AllGood(t *testing.T) {
	userHave := uint64(50)
	targetHave := uint64(13)
	userTransfer := uint64(16)

	owner := createOrbsAddress()
	target := createOrbsAddress()

	InServiceScope(owner, owner, func(m Mockery) {
		state.WriteUint64(owner, userHave)
		state.WriteUint64(target, targetHave)

		// call
		test._transferImpl(owner, target, userTransfer)

		// assert
		require.Equal(t, userHave-userTransfer, state.ReadUint64(owner))
		require.Equal(t, targetHave+userTransfer, state.ReadUint64(target))
	})
}

func TestTransferImpl_NotEnough(t *testing.T) {
	userHave := uint64(12)
	targetHave := uint64(13)
	userTransfer := uint64(16)

	owner := createOrbsAddress()
	target := createOrbsAddress()

	InServiceScope(owner, nil, func(m Mockery) {
		state.WriteUint64(owner, userHave)
		state.WriteUint64(target, targetHave)

		// call
		require.Panics(t, func() {
			test._transferImpl(owner, target, userTransfer)
		}, "should panic not enough")
	})
}

func TestApproveAllow_AllGood(t *testing.T) {
	approveAmount := uint64(16)

	owner := createOrbsAddress()
	caller := createOrbsAddress()
	spender := createOrbsAddress()

	InServiceScope(owner, caller, func(m Mockery) {
		// call
		test.approve(spender, approveAmount)

		allowKey := append(caller, spender...)

		// assert
		require.Equal(t, approveAmount, state.ReadUint64(allowKey))
		require.Equal(t, approveAmount, test.allowance(caller, spender))
	})
}

func TestApprove_BadAddress(t *testing.T) {
	owner := createOrbsAddress()

	InServiceScope(owner, nil, func(m Mockery) {
		// call
		require.Panics(t, func() {
			test.approve([]byte{0, 0, 4, 5}, 10)
		}, "should panic bad address")
	})
}

// TODO - rewrite once the sdk is better
/*func TestTransferFrom_AllGood(t *testing.T) {
	userHave := uint64(50)
	userTransfer := uint64(16)
	userApprove := uint64(20)

	from, err := orbsclient.CreateAccount()
	require.NoError(t, err, "could not create orbs address 1")
	spender, err := orbsclient.CreateAccount()
	require.NoError(t, err, "could not create orbs address 2")
	to, err := orbsclient.CreateAccount()
	require.NoError(t, err, "could not create orbs address 2")


	state.WriteUint64ByAddress(from.AddressAsBytes(), userHave)
	InServiceScope(nil, from.AddressAsBytes(), func(m Mockery) {
		approve(spender.AddressAsBytes(), userApprove)
	})

	InServiceScope(nil, spender.AddressAsBytes(), func(m Mockery) {
		// call
		transferFrom(from.AddressAsBytes(), to.AddressAsBytes(), userTransfer)
	})

	// assert
	require.Equal(t, userHave-userTransfer, state.ReadUint64ByAddress(from.AddressAsBytes()))
	require.Equal(t, userTransfer, state.ReadUint64ByAddress(to.AddressAsBytes()))
	require.Equal(t, userApprove-userTransfer, state.ReadUint64ByKey(_allowKey(from.AddressAsBytes(), spender.AddressAsBytes())))
}

func TestTransferFrom_NotEnoughApprove(t *testing.T) {
	userHave := uint64(12)
	userTransfer := uint64(16)
	userApprove := uint64(13)

	owner, err := orbsclient.CreateAccount()
	require.NoError(t, err, "could not create orbs address 1")
	target, err := orbsclient.CreateAccount()
	require.NoError(t, err, "could not create orbs address 2")

	InServiceScope(owner.AddressAsBytes(), nil, func(m Mockery) {
		state.WriteUint64ByAddress(owner.AddressAsBytes(), userHave)

		// call
		approve(target.AddressAsBytes(), userApprove)
		require.Panics(t, func() {
			transferFrom(owner.AddressAsBytes(), target.AddressAsBytes(), userTransfer)
		}, "should panic not enough")
	})
}
*/
func TestTransferFrom_BadSrcAddress(t *testing.T) {
	owner := createOrbsAddress()

	InServiceScope(owner, nil, func(m Mockery) {
		// call
		require.Panics(t, func() {
			test.transferFrom([]byte{0, 0, 4, 5}, owner, 10)
		}, "should panic bad address")
	})
}

func TestTransferFrom_BadTargetAddress(t *testing.T) {
	owner := createOrbsAddress()

	InServiceScope(owner, nil, func(m Mockery) {
		// call
		require.Panics(t, func() {
			test.transferFrom(owner, []byte{0, 0, 4, 5}, 10)
		}, "should panic bad address")
	})
}

func TestMint(t *testing.T) {
	total := uint64(50)
	startWith := uint64(12)
	mintAmount := uint64(16)

	owner := createOrbsAddress()
	asbcontract := createOrbsAddress()
	target := createOrbsAddress()

	InServiceScope(owner, asbcontract, func(m Mockery) {
		state.WriteUint64(test.TOTAL_SUPPLY_KEY, total)
		state.WriteUint64(target, startWith)
		state.WriteBytes(test.ASB_ADDR_KEY, asbcontract)

		// call
		test.asbMint(target, mintAmount)

		// assert
		require.Equal(t, total+mintAmount, state.ReadUint64(test.TOTAL_SUPPLY_KEY))
		require.Equal(t, startWith+mintAmount, state.ReadUint64(target))
	})
}

func TestMint_BadAddress(t *testing.T) {
	owner := createOrbsAddress()
	asbcontract := createOrbsAddress()

	InServiceScope(owner, asbcontract, func(m Mockery) {
		state.WriteBytes(test.ASB_ADDR_KEY, asbcontract)
		// call
		require.Panics(t, func() {
			test.asbMint([]byte{0, 0, 4, 5}, 10)
		}, "should panic bad address")
	})
}

func TestBurn_AllGood(t *testing.T) {
	total := uint64(50)
	startWith := uint64(22)
	burnAmount := uint64(16)

	owner := createOrbsAddress()
	asbcontract := createOrbsAddress()
	target := createOrbsAddress()

	InServiceScope(owner, asbcontract, func(m Mockery) {
		state.WriteUint64(test.TOTAL_SUPPLY_KEY, total)
		state.WriteUint64(target, startWith)
		state.WriteBytes(test.ASB_ADDR_KEY, asbcontract)

		// call
		test.asbBurn(target, burnAmount)

		// assert
		require.Equal(t, total-burnAmount, state.ReadUint64(test.TOTAL_SUPPLY_KEY))
		require.Equal(t, startWith-burnAmount, state.ReadUint64(target))
	})
}

func TestBurn_NotEnough(t *testing.T) {
	total := uint64(50)
	startWith := uint64(12)
	burnAmount := uint64(16)

	owner := createOrbsAddress()
	asbcontract := createOrbsAddress()
	target := createOrbsAddress()

	InServiceScope(owner, asbcontract, func(m Mockery) {
		state.WriteUint64(test.TOTAL_SUPPLY_KEY, total)
		state.WriteUint64(target, startWith)
		state.WriteBytes(test.ASB_ADDR_KEY, asbcontract)

		// call
		require.Panics(t, func() {
			test.asbBurn(target, burnAmount)
		}, "should panic not enough")
	})
}

func TestBurn_BadAddress(t *testing.T) {
	owner := createOrbsAddress()
	asbcontract := createOrbsAddress()

	InServiceScope(owner, asbcontract, func(m Mockery) {
		state.WriteBytes(test.ASB_ADDR_KEY, asbcontract)
		// call
		require.Panics(t, func() {
			test.asbBurn([]byte{0, 0, 4, 5}, 10)
		}, "should panic bad address")
	})
}

// TODO v1 - talkol when the testing sdk is better this can be uncommented.
/*func TestBindAsb_AllGood(t *testing.T) {
	owner := createOrbsAddress()
	asbcontract := "asbcontract"

	InServiceScope(owner, owner, func(m Mockery) {
		_init()

		// call
		asbBind(asbcontract)

		// assert
		require.Equal(t, address.GetContractAddress(asbcontract), state.ReadBytes(ASB_ADDR_KEY))
	})
}*/

func TestBindAsb_WrongCaller(t *testing.T) {
	owner := createOrbsAddress()
	caller := createOrbsAddress()

	InServiceScope(owner, caller, func(m Mockery) {
		test._init()

		// call
		require.Panics(t, func() {
			test.asbBind("asbcontract")
		}, "should panic bad caller")
	})
}

// TODO(v1): talkol - I will move this to be part of the test framework
func createOrbsAddress() []byte {
	orbsUser, err := orbsClient.CreateAccount()
	if err != nil {
		panic(err.Error())
	}
	return orbsUser.AddressAsBytes()
}
