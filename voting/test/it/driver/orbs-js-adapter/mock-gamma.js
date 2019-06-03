const Orbs = require("orbs-client-sdk");
const assert = require("assert");
const fs = require("fs");

const END_POINTS = JSON.parse(fs.readFileSync("orbs-gamma-config.json").toString()).Environments;
const ACCOUNTS = JSON.parse(fs.readFileSync("orbs-test-keys.json").toString());

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

function mimicGammaOutputFormat(responseObject) {
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
                for (let i = 0; i < responseObject[prop].length; i++) {
                    responseObject[prop][i] = mimicGammaOutputFormat(responseObject[prop][i]);
                }
            } else if (typeof responseObject[prop] !== "string") {
                responseObject[prop] = mimicGammaOutputFormat(responseObject[prop]);
            }
        }
    }
    return responseObject;
}

function orbsArguments(tx) {
    return tx.Arguments.map((arg, i) => { // convert values to orbs types
        switch (arg["Type"]) {
            case "string":
                return Orbs.argString(arg.Value);
            case "bytes":
                return Orbs.argBytes(Orbs.decodeHex(arg.Value));
            case "address":
                return Orbs.argAddress(arg.Value);
            case "uint32":
                return Orbs.argUint32(arg.Value);
            case "uint64":
                return Orbs.argUint64(arg.Value);
            default:
                throw (`unsupported for argument ${i + 1}:\n${JSON.stringify(arg, null, 2)}`)
        }
    });
}

function inflateTx(templateFilename, args) {
    const tx = JSON.parse(fs.readFileSync(templateFilename).toString());

    tx.ContractName = args.name || tx.ContractName; // override contract name with name argument

    for (let argName in args) { // override default with args
        if (argName.startsWith("arg")) {
            let argIdx = parseInt(argName.slice(3));
            try {
                tx.Arguments[argIdx - 1].Value = args[argName];
            } catch (e) {
                console.error("cannot assign value to argument", argIdx, e);
            }
        }
    }

    return {contractName: tx.ContractName, methodName: tx.MethodName, arguments: orbsArguments(tx)};
}

async function deployContract(client, signer, contractName, filename) {
    const b = fs.readFileSync(filename);
    const contractCode = new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    const [t, txid] = client.createTransaction(Orbs.decodeHex(signer.PublicKey), Orbs.decodeHex(signer.PrivateKey), "_Deployments", "deployService", [Orbs.argString(contractName), Orbs.argUint32(1), Orbs.argBytes(contractCode)]);
    return await client.sendTransaction(t);
}

(async () => {
    let args = {
        env: "local" // default
    };

    const op = process.argv[2];
    const primaryParam = process.argv[3];

    for (let i = 4; i < process.argv.length; i += 2) {
        args[process.argv[i].slice(1)] = process.argv[i + 1];
    }

    assert(END_POINTS[args.env], "unknown -env");

    const orbsEndpoint = END_POINTS[args.env].Endpoints[0];
    const orbsVchain = END_POINTS[args.env].VirtualChain;
    const signer = ACCOUNTS[args.signer];

    const client = new Orbs.Client(orbsEndpoint, orbsVchain, Orbs.NetworkType.NETWORK_TYPE_TEST_NET);

    let result;
    switch (op) {
        case "send-tx": {
            const {contractName, methodName, arguments} = inflateTx(primaryParam, args);
            const [t, txId] = client.createTransaction(Orbs.decodeHex(signer.PublicKey), Orbs.decodeHex(signer.PrivateKey), contractName, methodName, arguments);
            result = await client.sendTransaction(t);
            result.TxId = txId;

            break;
        }
        case "run-query": {
            const {contractName, methodName, arguments} = inflateTx(primaryParam, args);
            const q = client.createQuery( Orbs.decodeHex(signer.PublicKey), contractName, methodName, arguments);
            result = await client.sendQuery(q);

            break;
        }
        case "deploy": {
            result = await deployContract(client, signer, args.name, primaryParam);
            break;
        }
        case "tx-proof": {
            result = await client.getTransactionReceiptProof(primaryParam);
            break;
        }
        default:
            throw (`unsupported operation ${op}`)
    }
    console.log(JSON.stringify(mimicGammaOutputFormat(result), null, 2));
})();