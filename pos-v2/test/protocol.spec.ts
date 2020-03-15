import 'mocha';


import BN from "bn.js";
import {Driver, DEPLOYMENT_SUBSET_MAIN, expectRejected} from "./driver";
import chai from "chai";
import {web3} from "../eth";

chai.use(require('chai-bn')(BN));
chai.use(require('./matchers'));

const expect = chai.expect;

import {bn} from "./helpers";

describe('protocol-contract', async () => {

  it('schedules a protocol version upgrade for the main, canary deployment subsets', async () => {
    const d = await Driver.new();

    const curBlockNumber: number = await new Promise((resolve, reject) => web3.eth.getBlockNumber((err, blockNumber) => err ? reject(err): resolve(blockNumber)));
    let r = await d.protocol.setProtocolVersion(DEPLOYMENT_SUBSET_MAIN, 2, curBlockNumber + 100);
    expect(r).to.have.a.protocolChangedEvent({
      deploymentSubset: DEPLOYMENT_SUBSET_MAIN,
      protocolVersion: bn(2),
      asOfBlock: bn(curBlockNumber + 100)
    });

    r = await d.protocol.setProtocolVersion("canary", 2, 0);
    expect(r).to.have.a.protocolChangedEvent({
      deploymentSubset: "canary",
      protocolVersion: bn(2),
      asOfBlock: bn(0)
    });

    r = await d.protocol.setProtocolVersion("canary", 3, curBlockNumber + 100);
    expect(r).to.have.a.protocolChangedEvent({
      deploymentSubset: "canary",
      protocolVersion: bn(3),
      asOfBlock: bn(curBlockNumber + 100)
    });
  });

  it('does not allow protocol upgrade to be scheduled before the latest upgrade schedule', async () => {
    const d = await Driver.new();

    const curBlockNumber: number = await new Promise((resolve, reject) => web3.eth.getBlockNumber((err, blockNumber) => err ? reject(err): resolve(blockNumber)));
    let r = await d.protocol.setProtocolVersion(DEPLOYMENT_SUBSET_MAIN, 2, curBlockNumber + 100);
    expect(r).to.have.a.protocolChangedEvent({
      deploymentSubset: DEPLOYMENT_SUBSET_MAIN,
      protocolVersion: bn(2),
      asOfBlock: bn(curBlockNumber + 100)
    });

    await expectRejected(d.protocol.setProtocolVersion(DEPLOYMENT_SUBSET_MAIN, 3, curBlockNumber + 100));
    await expectRejected(d.protocol.setProtocolVersion(DEPLOYMENT_SUBSET_MAIN, 3, curBlockNumber + 99));
  });

  it('does not allow protocol upgrade to be scheduled in the past', async () => {
    const d = await Driver.new();

    const curBlockNumber: number = await new Promise((resolve, reject) => web3.eth.getBlockNumber((err, blockNumber) => err ? reject(err): resolve(blockNumber)));
    await expectRejected(d.protocol.setProtocolVersion(DEPLOYMENT_SUBSET_MAIN, 2, curBlockNumber));
  });

  it('does not allow protocol downgrade', async () => {
    const d = await Driver.new();

    const curBlockNumber: number = await new Promise((resolve, reject) => web3.eth.getBlockNumber((err, blockNumber) => err ? reject(err): resolve(blockNumber)));
    let r = await d.protocol.setProtocolVersion(DEPLOYMENT_SUBSET_MAIN, 3, curBlockNumber + 100);
    expect(r).to.have.a.protocolChangedEvent({
      deploymentSubset: DEPLOYMENT_SUBSET_MAIN,
      protocolVersion: bn(3),
      asOfBlock: bn(curBlockNumber + 100)
    });

    await expectRejected(d.protocol.setProtocolVersion(DEPLOYMENT_SUBSET_MAIN, 3, curBlockNumber + 101));
    await expectRejected(d.protocol.setProtocolVersion(DEPLOYMENT_SUBSET_MAIN, 2, curBlockNumber + 102));
  });

});
