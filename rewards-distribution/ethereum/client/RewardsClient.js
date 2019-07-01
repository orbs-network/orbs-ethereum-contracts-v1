const fs = require('fs');
const parse = require('csv-parse');
const assert = require('assert');
const web3utils = require("web3").utils;

class RewardsClient {
    constructor(rewardsContract) {
        this.rewardsContract = rewardsContract;
    }

    async parseBatches(filename, batchSize) {
        const csv = fs.readFileSync(filename).toString();

        // parse input file
        const rewardsSuperset = await parseCsv(csv);

        // verify no duplicate recipient
        const recipientsSet = new Set(rewardsSuperset.map(i => i.address));
        assert.strictEqual(
            recipientsSet.size,
            rewardsSuperset.length,
            "duplicate recipients detected"
        );

        // split to batches
        const tempData = [...rewardsSuperset];
        const batches = [];
        while (tempData.length) {
            batches.push(tempData.splice(0, batchSize));
        }

        // calculate batch hashes
        const hashes = batches.map((batch, batchId) =>
            RewardsClient.hashBatch(batchId, batch));

        // sum total amount
        const totalAmount = rewardsSuperset.reduce((sum, reward) =>
            sum.add(web3utils.toBN(reward.amount)), web3utils.toBN(0));

        return {
            totalAmount,
            rewardsSuperset,
            batches,
            hashes
        };
    }

    async executeBatches(distributionEvent, batches, options) {
        const results = [];
        for (let i = 0; i < batches.length; i++) {
            console.log(`executing batch ${i + 1}/${batches.length}...`);
            const batch = batches[i];
            try {
                const res = await this.rewardsContract.executeCommittedBatch(
                    distributionEvent,
                    batch.map(r => r.address),
                    batch.map(r => r.amount),
                    i,
                    options
                );
                results.push(res);
            } catch (e) {
                results.push(e);
            }
        }
        return results;
    }

    async getPendingBatches(distributionEvent) {
        return await this.rewardsContract.getPendingBatches(distributionEvent);
    }

    static hashBatch(batchId, batch) {
        let addresses = [];
        let amounts = [];
        batch.map((reward, index) => {
            const bytes32PaddedAddress = web3utils.leftPad(reward.address, 64);
            addresses[index] = {t: 'bytes32', v: bytes32PaddedAddress};
            amounts[index] = {t: 'uint256', v: reward.amount};
        });
        return web3utils.soliditySha3(
            {t: 'uint256', v: batchId},
            {t: 'uint256', v: batch.length},
            ...addresses,
            ...amounts
        );
    }
}

function parseCsv(csv) {
    return new Promise((resolve, reject) => {
        const parser = parse({columns: true}, function (err, records) {
            if (err) {
                reject(err);
            }
            resolve(records.map(r => {
                const amount = r["total_rewards"] || r["total rewards"];
                const address = r["address"];
                assert.ok(amount, "row missing amount column");
                assert.ok(address, "row missing address column");
                return {
                    address: address.toLowerCase(),
                    amount: toOrbitons(parseInt(amount.replace(/,/g, "")))
                }
            }));
        });
        parser.write(csv);
        parser.end();
    });
}

function toOrbitons(orbs) {
    return web3utils.toBN(orbs).mul(web3utils.toBN("1000000000000000000"));
}

module.exports = {
    RewardsClient
};
