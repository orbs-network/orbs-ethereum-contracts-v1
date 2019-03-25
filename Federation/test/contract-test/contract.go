// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package main

import (
	"github.com/orbs-network/orbs-contract-sdk/go/sdk"
	"github.com/orbs-network/orbs-contract-sdk/go/sdk/events"
)

var SYSTEM = sdk.Export(_init)
var PUBLIC = sdk.Export(testTransferOut)
var EVENTS = sdk.Export(OrbsTransferredOut)

func OrbsTransferredOut(tuid uint64, ethAddress []byte, orbsAddress []byte, amount uint64) {}

func _init() {}

func testTransferOut() {
	tuid := uint64(1)
	ethAddress := []byte{0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a}
	orbsAddress := []byte{0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a}
	amount := uint64(1001)

	events.EmitEvent(OrbsTransferredOut, tuid, ethAddress, orbsAddress, amount)
}
