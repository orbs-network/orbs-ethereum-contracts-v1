import * as fs from "fs";
import * as path from "path";

export type CompiledContracts = {[contractName: string]: any};

function loadCompiledContracts(baseDir: string): CompiledContracts {
    const artifacts: CompiledContracts = {};
    for (const fname of fs.readdirSync(baseDir)) {
        const name = fname.replace('.json', '');
        const abi = JSON.parse(fs.readFileSync(baseDir + '/' + fname, {encoding:'utf8'}));
        artifacts[name] = abi;
    }
    return artifacts;
}

export const compiledContracts = loadCompiledContracts(path.join(__dirname, 'build', 'contracts'));
