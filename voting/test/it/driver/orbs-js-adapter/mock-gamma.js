
const Orbs = require("orbs-client-sdk");
const assert = require("assert");

const envFile = JSON.parse(require("fs").readFileSync("orbs-gamma-config.json").toString());
const usersFile = JSON.parse(require("fs").readFileSync("orbs-test-keys.json").toString());

function capitalizeProperty(key, obj) {
    if (typeof key === "string" && key.length > 0) {
        let capitalized = key.charAt(0).toUpperCase() + key.slice(1);
        if (capitalized !== key) {
            obj[capitalized] = obj[key];
            delete obj[key];
            key = capitalized;
        }
    }
    return key;
}

function mimicGammaOutputFormat(responseObject, txId) {
    for (let prop in responseObject) {
        if (responseObject.hasOwnProperty(prop)) {
            prop = capitalizeProperty(prop, responseObject);

            if (prop === "TxHash") {
                delete responseObject[prop];
            } else if (Buffer.isBuffer(responseObject[prop])) {
                responseObject[prop] = Orbs.encodeHex(new Uint8Array(responseObject[prop])).toLowerCase();
            } else if (typeof responseObject[prop] === "bigint") {
                responseObject[prop] = responseObject[prop].toString();
            } else if (Array.isArray(responseObject[prop])) {
                for (let i=0; i < responseObject[prop].length; i++) {
                    responseObject[prop][i] = mimicGammaOutputFormat(responseObject[prop][i]);
                }
            } else if (typeof responseObject[prop] !== "string") {
                responseObject[prop] = mimicGammaOutputFormat(responseObject[prop]);
            }
        }
    }
    return responseObject;
}

function translateOrbsArgumentType(arg, i) {
    switch (arg["Type"]) {
        case "string":
            arg.typed = Orbs.argString(arg.Value);
            break;
        case "bytes":
            arg.typed = Orbs.argBytes(Orbs.decodeHex(arg.Value));
            break;
        case "address":
            arg.typed = Orbs.argAddress(arg.Value);
            break;
        case "uint32":
            arg.typed = Orbs.argUint32(arg.Value);
            break;
        case "uint64":
            arg.typed = Orbs.argUint64(arg.Value);
            break;
        default:
            throw (`unsupported for argument ${i + 1}:\n${JSON.stringify(arg, null, 2)}`)
    }
}

async function sendTx(client, signer, args, filename) {
    const tx = JSON.parse(require("fs").readFileSync(filename).toString());

    applyArgsToTxTemplate(tx, args);

    const [t, txid] = client.createTransaction(Orbs.decodeHex(signer.PublicKey), Orbs.decodeHex(signer.PrivateKey), tx.ContractName, tx.MethodName, tx.Arguments.map(arg => arg.typed));
    const result = await client.sendTransaction(t);
    result.TxId = txid;

    return result;
}

async function runQuery(client, signer, args, filename) {
    const tx = JSON.parse(require("fs").readFileSync(filename).toString());

    applyArgsToTxTemplate(tx, args);

    const q = client.createQuery(Orbs.decodeHex(signer.PublicKey), tx.ContractName, tx.MethodName, tx.Arguments.map(arg => arg.typed));
    const result = await client.sendQuery(q);

    return result;
}

async function deployContract(client, signer, contractName, filename) {
    const b = require("fs").readFileSync(filename);
    const contractCode = new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    const [t, txid] = client.createTransaction(Orbs.decodeHex(signer.PublicKey), Orbs.decodeHex(signer.PrivateKey), "_Deployments", "deployService", [Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(contractCode)]);
    const result = await client.sendTransaction(t);
    return result;
}

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
        translateOrbsArgumentType(arg, i);
    });
}

(async()=>{
    let args = {
        env: "local" // default
    };

    const op = process.argv[2];
    const primaryParam = process.argv[3];

    for (let i = 4; i < process.argv.length; i += 2) {
        args[process.argv[i].slice(1)] = process.argv[i+1];
    }

    assert(envFile.Environments[args.env], "unknown -env");

    const orbsEndpoint = envFile.Environments[args.env].Endpoints[0];
    const orbsVchain = envFile.Environments[args.env].VirtualChain;
    const signer = args.signer ? usersFile[args.signer] : {};

    const client = new Orbs.Client(orbsEndpoint, orbsVchain, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);

    let result;
    switch (op) {
        case "send-tx":
            result = await sendTx(client, signer, args, primaryParam);
            break;
        case "run-query":
            result = await runQuery(client, signer, args, primaryParam);
            break;
        case "deploy":
            result = await deployContract(client, signer, args.name, primaryParam);
            break;
        case "tx-proof":
            result = await client.getTransactionReceiptProof(primaryParam);
            break;
        default:
            throw (`unsupported operation ${op}`)
    }
    console.log(JSON.stringify(mimicGammaOutputFormat(result), null, 2));
})();