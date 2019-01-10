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
