import * as util from "util";
import * as path from "path";
import { CommitteeChangedEvent } from "../typings/elections-contract";

const exec = util.promisify(require('child_process').exec);

export class CommitteeProvider {

    constructor(private ethereumEndpoint,
                private posContractAddress) {}

    async getCommitteeAsOf(blockNumber): Promise<CommitteeChangedEvent> {
        const adapterPath = path.resolve(".", "management-adapter", "main.go");
        const {stdout, stderr} = await exec(`go run ${adapterPath} --as-of-block ${blockNumber} --addresses ${this.posContractAddress} --ethereum-endpoint ${this.ethereumEndpoint}`);

        if (stdout.length === 0 && stderr.length > 0) {
            throw new Error(stderr);
        } else {
            return JSON.parse(stdout);
        }
    }
}

