
const Orbs = require("orbs-client-sdk");
const assert = require("assert");

const envFile = JSON.parse(require("fs").readFileSync("orbs-gamma-config.json").toString());
const usersFile = JSON.parse(require("fs").readFileSync("orbs-test-keys.json").toString());


let args = {
    env: "local" // default
};

const op = process.argv[2];
const unnamedParam = process.argv[3];

for (let i = 4; i < process.argv.length; i += 2) {
    args[process.argv[i].slice(1)] = process.argv[i+1];
}

assert(envFile.Environments[args.env], "unknown -env");
assert(usersFile[args.signer], "unknown -signer");

const orbsEndpoint = envFile.Environments[args.env].Endpoints[0];
const orbsVchain = envFile.Environments[args.env].VirtualChain;
const signer = args.signer ? usersFile[args.signer] : {};

const client = new Orbs.Client(orbsEndpoint, orbsVchain, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);

function capitalizeProperty(prop, responseObject) {

    const charCodeLowcaseA = "a".charCodeAt(0);
    const charCodeLowcaseZ = "z".charCodeAt(0);

    if (typeof prop === "string" &&
        prop.charCodeAt(0) >= charCodeLowcaseA &&
        prop.charCodeAt(0) <= charCodeLowcaseZ) {
        let capitalized = prop.charAt(0).toUpperCase() + prop.slice(1)
        responseObject[capitalized] = responseObject[prop];
        delete responseObject[prop];
        prop = capitalized;
    }
    return prop;
}

function formatAsGammaCliResponse(responseObject, txId) {
    for (let prop in responseObject) {
        if (responseObject.hasOwnProperty(prop)) {
            prop = capitalizeProperty(prop, responseObject);

            if (prop === "TxHash") {
                delete responseObject[prop];
            } else if (Buffer.isBuffer(responseObject[prop])) { //typeof responseObject[prop] === "object" && responseObject[prop].type === "Buffer" && Array.isArray(responseObject[prop].data)) {
                responseObject[prop] = Orbs.encodeHex(new Uint8Array(responseObject[prop])).toLowerCase();
            } else if (typeof responseObject[prop] === "bigint") {
                responseObject[prop] = responseObject[prop].toString();
            } else if (Array.isArray(responseObject[prop])) {
                for (let i=0; i < responseObject[prop].length; i++) {
                    responseObject[prop][i] = formatAsGammaCliResponse(responseObject[prop][i]);
                }
            } else if (typeof responseObject[prop] !== "string") {
                responseObject[prop] = formatAsGammaCliResponse(responseObject[prop]);
            }
        }
    }
    return responseObject;
}

(async()=>{
    let result;
    switch (op) {
        case "send-tx":
        case "run-query":
            const tx = JSON.parse(require("fs").readFileSync(unnamedParam).toString());

            applyArgsToTxTemplate(tx, args);

            if (op === "send-tx") {
                const [ t, txid ] = client.createTransaction(Orbs.decodeHex(signer.PublicKey), Orbs.decodeHex(signer.PrivateKey), tx.ContractName, tx.MethodName, tx.Arguments.map(arg => arg.typed));
                result = await client.sendTransaction(t);
                result.TxId = txid;
            }
            if (op === "run-query") {
                const q = client.createQuery(Orbs.decodeHex(signer.PublicKey), tx.ContractName, tx.MethodName, tx.Arguments.map(arg => arg.typed));
                result = await client.sendQuery(q);
            }
            break;
        case "deploy":
            const b = require("fs").readFileSync(unnamedParam);
            const contractCode = new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT);
            const [ t, txid ] = client.createTransaction(Orbs.decodeHex(signer.PublicKey), Orbs.decodeHex(signer.PrivateKey), "_Deployments", "deployService", [Orbs.argString(args.name), Orbs.argUint32(1), Orbs.argBytes(contractCode)]);
            result = await client.sendTransaction(t);
            break;
        case "tx-proof":
            result = await client.getTransactionReceiptProof(unnamedParam);
            break;
        default:
            throw (`unsupported operation ${op}`)
    }
    console.log(JSON.stringify(formatAsGammaCliResponse(result), null, 2));
})();

function applyArgsToTxTemplate(tx, args) {
    tx.ContractName = args.name || tx.ContractName; // override contract name with name argument

    for (let argName in args) { // override values
        if (argName.startsWith("arg")) {
            let argIdx = parseInt(argName.slice(3));
            try {
                tx.Arguments[argIdx - 1].Value = args[argName];
            } catch (e) {
                console.error("cannot assign value to argument", argIdx, e);
            }
        }
    }

    tx.Arguments.forEach((arg, i) => { // enrich arguments with orbs types
        switch (arg["Type"]) {
            case "string":
                arg.typed = Orbs.argString(arg.Value);
                break;
            case "bytes":
                arg.typed = Orbs.argBytes(arg.Value);
                break;
            case "address":
                arg.typed = Orbs.argAddress(arg.Value);
                break;
            case "uint32":
                arg.typed = Orbs.argUint32(arg.Value);
                break;
            case "uint64":
                arg.typed = Orbs.argUint32(arg.Value);
                break;
            default:
                throw (`unsupported for argument ${i + 1}:\n${JSON.stringify(arg, null, 2)}`)
        }
    });
}

