import 'mocha';

import Web3 from "web3";
declare const web3: Web3;

import BN from "bn.js";
import { Driver } from "./driver";
import chai from "chai";
import { subscriptionChangedEvents } from "./event-parsing";
import rimraf from "rimraf";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { Contract, EventData } from "web3-eth-contract";
import { createVC } from './test-kit';

chai.use(require("chai-bn")(BN));
chai.use(require("./matchers"));

const expect = chai.expect;

const rmDir = (path: string): Promise<void> =>
  new Promise(resolve => rimraf(path, () => resolve()));

describe("subscriptions aggregation", async () => {
  it("reads VCs from SubscriptionChanged events", async () => {
    const d = await Driver.new();
    const numnberOfVChains = 5;

    for (let i of new Array(numnberOfVChains)) {
      let r = await createVC(d);
      expect(r).to.have.subscriptionChangedEvent();
    }

    const events = await d.subscriptions.web3Contract.getPastEvents("SubscriptionChanged", {
      fromBlock: 0,
      toBlock: "latest"
    });
    const vcs = events.map(event => event.returnValues.vcid);
    expect(vcs.length).to.eql(numnberOfVChains);
  });
});

// async function getEventsPaged(
//   contract: Contract,
//   eventType: string,
//   fromBlock: number,
//   toBlock: number,
//   pageSize: number
// ): Promise<Array<EventData>> {
//   const result: Array<EventData> = [];
//   for (let currBlock = fromBlock; currBlock < toBlock; currBlock += pageSize) {
//     const options = {
//       fromBlock: currBlock,
//       toBlock: Math.min(currBlock + pageSize, toBlock)
//     };
//     try {
//       const events = await contract.getPastEvents(
//         "SubscriptionChanged",
//         options
//       );
//       result.push(...events);
//     } catch (err) {
//       if (pageSize > 5) {
//         // assume there are too many events
//         const events = await getEventsPaged(
//           contract,
//           eventType,
//           options.fromBlock,
//           options.toBlock,
//           Math.floor(pageSize / 5)
//         );
//         result.push(...events);
//       } else throw err;
//     }
//   }
//   return result;
// }
