package orbs_js_adapter

import (
	"fmt"
	"github.com/orbs-network/orbs-ethereum-contracts/voting/test/it/driver"
	"os/exec"
	"strings"
)

func (ojs *OrbsJsSdkAdapter) run(args string) []byte {
	args += " -env " + ojs.env
	if ojs.debug {
		fmt.Println("\n  ### RUNNING: node mock-gamma.js " + args)
		fmt.Printf("\n  ### OUTPUT:\n\n")
	}
	argsArr := strings.Split("./driver/orbs-js-adapter/mock-gamma.js "+args, " ")
	cmd := exec.Command("node", argsArr...)
	var out []byte
	var err error
	if ojs.debug {
		out, err = driver.CombinedOutputWithStdoutPipe(cmd)
	} else {
		out, err = cmd.CombinedOutput()
	}
	if err != nil {
		panic(err.Error() + "\n" + string(out))
	}
	return out
}

