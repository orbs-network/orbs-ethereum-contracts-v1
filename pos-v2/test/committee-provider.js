const util = require('util');
const path = require('path');
const exec = util.promisify(require('child_process').exec);

class CommitteeProvider {

    constructor(posContractAddress) {
        this.posContractAddress = posContractAddress
    }

    async getCommitteeAsOf(blockNumber) {
        const adapterPath = path.resolve(".", "management-adapter", "main.go");
        const {stdout, stderr } = await exec(`go run ${adapterPath} --as-of-block ${blockNumber} --addresses ${this.posContractAddress}`);

        if (stdout.length === 0 && stderr.length > 0) {
            throw new Error(stderr);
        } else {
            return JSON.parse(stdout);
        }
    }
}

module.exports = CommitteeProvider;

