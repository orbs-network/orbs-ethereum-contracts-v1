
const fs = require('fs');
const parse = require('csv-parse');
const assert = require('assert');

function parseCsv(csv) {
    return new Promise((resolve, reject) => {
        const parser = parse({columns: true}, function (err, records) {
            if (err) {
                reject(err);
            }
            resolve(records.map(r=>{
                return {
                    address: r["address"].toLowerCase(),
                    amount: parseInt(r["total rewards"].replace(/,/g,""))
                }
            }));
        });
        parser.write(csv);
        parser.end();
    });
}

// TODO - shorten file and copy to project
// TODO - parse batches should return the batches and a tx that needs to be signed (copied into myCrypto or signed with web3 using a ledger provider)?
// TODO - announce rewards will be replaces with a transaction that is returned in parseBatches. integration tests will signe and sent this tx
// TODO - TBD - executeBatches can also be replaced with a list of tx that trigger batch execution and can be signed by anyone. OR, the batches may be stored in client state and sent from arbitrary account
// TODO - create a Class for the client to keep context variables


async function parseBatches(web3, filename, batchSize) {
    const csv = fs.readFileSync(filename).toString();

    // parse input file
    const rewardsToDistribute = await parseCsv(csv);

    // verify no duplicate recipient
    const recipientsSet = new Set(rewardsToDistribute.map(i => i.address));
    assert.strictEqual(recipientsSet.size,  rewardsToDistribute.length, "duplicate recipients detected");

    // split to batches
    const tempData = [...rewardsToDistribute];
    const batches = [];
    while (tempData.length) {
        batches.push(tempData.splice(0, batchSize));
    }

    // calculate batch hashes
    const hashes = batches.map((batch, batchId) => hashBatch(web3, batchId, batch));
    return {rewardsToDistribute, batches, hashes};
}

async function announceRewards(rewards, owner, distributionEvent, hashes){
    // announce distribution event with hash batches
    return await rewards.announceDistributionEvent(distributionEvent, hashes, {from: owner});
}

async function executeBatches(rewards, distributionEvent, batches) {
    const results = [];
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const res = await rewards.executeCommittedBatch(distributionEvent, batch.map(r => r.address), batch.map(r => r.amount), i);
        results.push(res);
    }
    return results;
}

function hashBatch(web3, batchId, batch) {
    let addresses = [];
    let amounts = [];
    batch.map((reward, index) => {
        const bytes32PaddedAddress = web3.utils.leftPad(reward.address, 64);
        addresses[index] = {t: 'bytes32', v: bytes32PaddedAddress};
        amounts[index] = {t: 'uint256', v: reward.amount};
    });
    return web3.utils.soliditySha3(
        {t: 'uint256', v: batchId},
        {t: 'uint256', v: batch.length},
        ...addresses,
        ...amounts
    );
}

module.exports = {
    parseBatches,
    hashBatch,
    announceRewards,
    executeBatches
};
