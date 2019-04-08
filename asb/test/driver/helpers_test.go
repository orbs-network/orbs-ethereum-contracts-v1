// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package driver

import (
	"fmt"
	"testing"
)

func TestPrettyColors(t *testing.T) {
	for i := 0; i < 50; i++ {
		fmt.Printf("\x1b[%d;1m\n%d ### hello world\x1b[0m\n", i, i)
	}
}
