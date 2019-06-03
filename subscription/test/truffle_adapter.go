// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package test

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"
)

type truffleAdapter struct {
	network string
}

func (t *truffleAdapter) deploySubscriptionManager() (string, error) {
	bytes := t.run("./truffle-scripts/deploySubscriptionManager.js")
	out := struct {
		Address string
	}{}
	err := json.Unmarshal(bytes, &out)
	if err != nil {
		return "", err
	}
	return out.Address, nil
}

func (t *truffleAdapter) GetCurrentBlock() (int, error) {
	bytesOutput := t.run("./truffle-scripts/getCurrentBlock.js")
	out := struct {
		CurrentBlock int
	}{}
	err := json.Unmarshal(bytesOutput, &out)
	if err != nil {
		return 0, err
	}
	return out.CurrentBlock, nil
}

func (t *truffleAdapter) WaitForBlock(blockNumber int) error {
	if t.network == "ganache" {
		currentBlockNumber, err := t.GetCurrentBlock()
		if err != nil {
			return err
		}
		blocksToMine := blockNumber - currentBlockNumber
		if blocksToMine > 0 {
			t.run("./truffle-scripts/mine.js", "BLOCKS_TO_MINE="+fmt.Sprintf("%d", blocksToMine))
		}
	} else { // busy wait until block number is reached
		fmt.Printf("Waiting for block %d...\n", blockNumber)
		for cb := 0; cb < blockNumber; {
			cb, err := t.GetCurrentBlock()
			if err != nil {
				return err
			}

			fmt.Printf("	current block is %d\n", cb)
			time.Sleep(1 * time.Second)
		}
	}

	return nil
}

func (t *truffleAdapter) run(args string, env ...string) []byte {
	var lastErr error
	for i := 0; i < 3; i++ { // retry loop

		out, err := t._run(args, env...) // 1 attempt
		if err != nil {
			lastErr = err

			fmt.Printf("\nError in attempt #%d. (error: %s) \n\n", i, err)

			time.Sleep(1 * time.Second)
			continue
		}

		// success
		return out

	}
	panic(lastErr)
}

func (t *truffleAdapter) _run(args string, env ...string) ([]byte, error) {
	args += " --network " + t.network

	argsArr := strings.Split(args, " ")
	cmd := exec.Command("node", argsArr...)
	cmd.Dir = "."
	cmd.Env = append(os.Environ(), env...)
	out, err := cmd.CombinedOutput()
	println(string(out))
	if err != nil {
		return nil, err
	}

	return out, nil
}

func newTruffle() *truffleAdapter {
	return &truffleAdapter{network: "ganache"}
}
