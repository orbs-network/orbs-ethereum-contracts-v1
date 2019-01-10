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
