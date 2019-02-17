package driver

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
)

func logStage(msg string, args ...interface{}) {
	fmt.Printf("\x1b[34;1m\n##############################################################################################\x1b[0m")
	fmt.Printf("\x1b[34;1m\n### "+msg+"\x1b[0m\n", args...)
}

func logStageDone(msg string, args ...interface{}) {
	fmt.Printf("\x1b[32;1m  >>> done! "+msg+"\x1b[0m\n\n\n", args...)
}

func logSummary(msg string, args ...interface{}) {
	fmt.Printf("\x1b[35;1m\n##############################################################################################\x1b[0m")
	fmt.Printf("\x1b[35;1m\n### "+msg+"\x1b[0m\n", args...)
}

func combinedOutputWithStdoutPipe(c *exec.Cmd) ([]byte, error) {
	if c.Stdout != nil {
		return nil, errors.New("exec: Stdout already set")
	}
	if c.Stderr != nil {
		return nil, errors.New("exec: Stderr already set")
	}
	var b bytes.Buffer
	w := io.MultiWriter(&b, os.Stdout)
	c.Stdout = w
	c.Stderr = w
	err := c.Run()
	return b.Bytes(), err
}

const STAKE_TOKEN_FACTOR = uint64(100000) // TODO V1 use correct translation
//const STAKE_TOKEN_FACTOR = uint64(1000000000000000000)
const STAKE_TOKEN_DELEGATE_VALUE = uint64(7)

func fromEthereumToken(tokenValue uint64) int {
	return int(tokenValue / STAKE_TOKEN_FACTOR)
}

func toEthereumToken(testValue int) uint64 {
	return uint64(testValue) * STAKE_TOKEN_FACTOR
}

type TransferEvent struct {
	FromIndex int
	ToIndex   int
	Amount    int
}

func getOrbsVotingContractName() string {
	return "OrbsVoting"
}

func getOrbsConfigContractName() string {
	return "OrbsConfig"
}
