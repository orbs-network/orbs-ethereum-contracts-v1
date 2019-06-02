package orbs_js_adapter

import (
	"os/exec"
	"strings"
)

func (ojs *OrbsJsSdkAdapter) run(args string, env ...string) []byte {
	args += " -env " + ojs.env
	argsArr := strings.Split("./orbs-js-adapter/mock-gamma.js "+args, " ")
	cmd := exec.Command("node", argsArr...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		panic(err.Error() + "\n" + string(out))
	}
	return out
}