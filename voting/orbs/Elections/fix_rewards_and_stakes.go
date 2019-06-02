// Copyright 2019 the orbs-network-go authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package elections_systemcontract

import (
	"encoding/hex"
	"fmt"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/v1/state"
)

var participants = []struct {
	address string
	reward  int
}{
	{"606feb20c03a797a42390163dedd1d45297af73f", 544},   // instead of 837
	{"63cad78066b28c58f29f58a4f55827b2c2259776", 1143},  // instead of 1971
	{"d5db86180abb0300334347a6a57bd318ffa7aebc", 731},   // instead of 1247
	{"9e912ba1ce059ceca9499ec9ec703b12d32cb50c", 731},   // instead of 1247
	{"aaa020747c3f27035a803a2a9b577e76ed5cdfc7", 378},   // instead of 630
	{"e4f60ade67862d6604cc7464621bc7ac17e75841", 187},   // instead of 319
	{"5d8c4be81a1203821b464bd76f43967f724d5004", 48},    // instead of 42
	{"a39fc2c9c437f2e56901ccc6bd18ee1100c82686", 698},   // instead of 1348
	{"683148b5e726a0c07561895e39f394c2d1ebf092", 72},    // instead of 63
	{"d7806c262ea5e3928d0970e2a0f19e931f9ed1af", 66728}, // instead of 58387
	{"f07df0a74967c53611f2bb619eec462527ddb5d3", 216},   // instead of 189
	{"0a91147313b82fdb20c853646e829b8d32a9fdb8", 1319},  // instead of 1879
	{"9e2d2a783274c81337fec2e2897fee5ec614cca0", 392},   // instead of 343
	{"fa76362c7937b02018abd99c04333d3b62ff7f3d", 507},   // instead of 975
	{"fddb0aa468c70be6440c46cfbdf099d2135e25a7", 1661},  // instead of 1663
	{"e933cedb1d7772ab3ca6ca8c173cc6b6ad61bb5f", 119},   // instead of 196
	{"aa1a4565f2d875995d85e8d52e7193c666e20c04", 434},   // instead of 748
	{"f061c6acc642676914aa7139abc89fbf97a06112", 15152}, // instead of 26516
	{"960ac2fd49b2088cfbb385fed12adb4d78429928", 5311},  // instead of 10339
	{"8fd0a7b70aa896cf85b3034385f98af1d927d442", 4082},  // instead of 0
}

var guardians = []struct {
	address string
	reward  int
}{
	{"f7ae622C77D0580f02Bcb2f92380d61e3F6e466c", 1181007}, // instead of 1184990
	{"63AEf7616882F488BCa97361d1c24F05B4657ae5", 1066014}, // instead of 1066039
	{"C82eC0F3c834d337c51c9375a1C0A65Ce7aaDaec", 704013},  // instead of 693586
	{"F058cCFB2324310C33E8FD9a1ddA8E99C8bEdA59", 454895},  // instead of 455563
	{"9afc8EF233e2793B2b90Ca5d70cA2e7098013142", 446628},  // instead of 447165
	{"8287928a809346dF4Cd53A096025a1136F7C4fF5", 274859},  // instead of 274969
	{"cB6172196BbCf5b4cf9949D7f2e4Ee802EF2b81D", 73678},   // instead of 65305
	{"a3cBDD66267DAaA4B51Af6CD894c92054bb2F2c7", 14134},   // instead of 40176
	{"1763F3DA9380E2df7FfDE1dC245801BB14F80669", 21887},   // instead of 15898
}

func _fixRewards() {
	key := []byte("_fixRewards_")
	if state.ReadUint32(key) == 0 {
		for _, participant := range participants {
			bytes, err := hex.DecodeString(participant.address)
			if err != nil {
				panic(fmt.Errorf("cannot parse %s , err %s", participant.address, err))
			}
			state.WriteUint64(_formatCumulativeParticipationReward(bytes), uint64(participant.reward))
		}

		for _, guardian := range guardians {
			bytes, err := hex.DecodeString(guardian.address)
			if err != nil {
				panic(fmt.Errorf("cannot parse %s , err %s", guardian.address, err))
			}
			state.WriteUint64(_formatCumulativeGuardianExcellenceReward(bytes), uint64(guardian.reward))
		}
		state.WriteUint32(key, 1)
	} else {
		panic(fmt.Sprintf("cannot fix rewards anymore"))
	}
}

var doubleDelegators = []string{
	"aaa020747c3f27035a803a2a9b577e76ed5cdfc7",
	"e933cedb1d7772ab3ca6ca8c173cc6b6ad61bb5f",
	"d5db86180abb0300334347a6a57bd318ffa7aebc",
	"9e912ba1ce059ceca9499ec9ec703b12d32cb50c",
	"e4f60ade67862d6604cc7464621bc7ac17e75841",
	"a39fc2c9c437f2e56901ccc6bd18ee1100c82686",
	"aa1a4565f2d875995d85e8d52e7193c666e20c04",
	"63cad78066b28c58f29f58a4f55827b2c2259776",
	"fa76362c7937b02018abd99c04333d3b62ff7f3d",
	"960ac2fd49b2088cfbb385fed12adb4d78429928",
	"f061c6acc642676914aa7139abc89fbf97a06112",
	"606feb20c03a797a42390163dedd1d45297af73f",
}

func _fixDelegatorState() {
	key := []byte("_fixDelegatorState_")
	if state.ReadUint32(key) == 0 {

		doubleDelegatorMap := make(map[[20]byte]bool, len(doubleDelegators))
		for _, delegator := range doubleDelegators {
			bytes, err := hex.DecodeString(delegator)
			if err != nil {
				panic(fmt.Errorf("cannot parse %s , err %s", delegator, err))
			}
			doubleDelegatorMap[_addressSliceToArray(bytes)] = true
		}

		numOfDelegators := _getNumberOfDelegators()
		newNumofDelegators := numOfDelegators
		for i := 0; i < numOfDelegators; i++ {
			delegator := _getDelegatorAtIndex(i)
			if doubleDelegatorMap[delegator] {
				_setDelegatorAtIndex(i, state.ReadBytes(_formatDelegatorIterator(newNumofDelegators-1)))
				delete(doubleDelegatorMap, delegator)
				newNumofDelegators--
			}
		}

		for i := newNumofDelegators; i < numOfDelegators; i++ {
			state.Clear(_formatDelegatorIterator(newNumofDelegators))
		}
		_setNumberOfDelegators(newNumofDelegators)
		state.WriteUint32(key, 1)
	} else {
		panic(fmt.Sprintf("cannot fix delegate state for double delegations anymore"))
	}
}
