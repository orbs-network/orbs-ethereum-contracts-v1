package test

import (
	"bytes"
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
	bytes := t.run("exec ./truffle-scripts/deploySubscriptionManager.js")
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
	bytesOutput := t.run("exec ./truffle-scripts/getCurrentBlock.js")
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
			t.run("exec ./truffle-scripts/mine.js", "BLOCKS_TO_MINE="+fmt.Sprintf("%d", blocksToMine))
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
	cmd := exec.Command("./node_modules/.bin/truffle", argsArr...)
	cmd.Dir = "."
	cmd.Env = append(os.Environ(), env...)
	out, err := cmd.CombinedOutput()
	println(string(out))
	if err != nil {
		return nil, err
	}
	// remove first line of output (Using network...)
	index := bytes.IndexRune(out, '\n')

	if index == -1 {
		return nil, fmt.Errorf("failed to find fist linefeed in output: %s", string(out))
	}

	return out[index:], nil
}

func newTruffle() *truffleAdapter {
	return &truffleAdapter{network: "ganache"}
}
