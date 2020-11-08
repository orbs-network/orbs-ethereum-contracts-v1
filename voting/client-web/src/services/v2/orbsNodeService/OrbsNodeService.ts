import { IOrbsNodeService } from './IOrbsNodeService';
import Web3 from 'web3';
import { fetchJson } from './nodeResponseProcessing/helpers';
import { SystemState } from './systemState';
import { updateSystemState } from './nodeResponseProcessing/processor-public';
import { ICommitteeMemberData, IReadAndProcessResults } from './OrbsNodeTypes';
import { IManagementStatusResponse } from './nodeResponseProcessing/RootNodeData';
import { IEthereumWriterStatusResponse } from './nodeResponseProcessing/EthereumWriterStatusResponse';
import Moment from 'moment';

// const MAIN_NET_DEFAULT_NODE_URL = 'http://34.255.138.28';
const MAIN_NET_DEFAULT_NODE_URL = 'https://guardian.v2beta.orbs.com';
const ManagementStatusSuffix = '/services/management-service/status';
const EthereumWriterStatusSuffix = '/services/ethereum-writer/status';

// TODO : O.L : Consider using httpService
export class OrbsNodeService implements IOrbsNodeService {
  constructor(private defaultNodeUrl: string = MAIN_NET_DEFAULT_NODE_URL) {}

  public get defaultNodeAddress(): string {
    return this.defaultNodeUrl;
  }

  async checkIfDefaultNodeIsInSync(): Promise<boolean> {
    return this.checkIfNodeIsInSync(this.defaultNodeUrl);
  }

  async checkIfNodeIsInSync(nodeAddress: string): Promise<boolean> {
    try {
      const managementStatusResponse: IManagementStatusResponse = await this.fetchNodeManagementStatus(nodeAddress);
      const ethereumWriterStatusResponse: IEthereumWriterStatusResponse = await this.fetchNodeEthereumWriterStatus(
        nodeAddress,
      );

      const isEthereumWriterInSync = ethereumWriterStatusResponse.Payload.VchainSyncStatus === 'in-sync';

      const currentTimestamp = Moment().unix();

      const ACCEPTED_RANGE_IN_SECONDS = 60 * 60; // 60 minutes
      const earliestAcceptedTimestamp = currentTimestamp - ACCEPTED_RANGE_IN_SECONDS;

      const nodeRefTime = managementStatusResponse.Payload.CurrentRefTime;
      const isManagementServiceReferenceFresh = nodeRefTime >= earliestAcceptedTimestamp;

      const isNodeInSync = isManagementServiceReferenceFresh && isEthereumWriterInSync;

      return isNodeInSync;
    } catch (e) {
      console.error(`Error while getting node ${nodeAddress} status: ${e}`);
      return false;
    }
  }

  async readAndProcessSystemState(nodeAddress?: string): Promise<IReadAndProcessResults> {
    const nodeUrl = nodeAddress || this.defaultNodeUrl;
    const systemState = new SystemState();

    const managementStatusResponse = await this.fetchNodeManagementStatus(nodeUrl);

    const currentTimeStamp = Math.floor(Date.now() / 1000);
    updateSystemState(systemState, managementStatusResponse, currentTimeStamp);

    return {
      systemState,
      committeeMembers: managementStatusResponse.Payload.CurrentCommittee,
    };
  }

  private async fetchNodeManagementStatus(nodeAddress: string): Promise<IManagementStatusResponse> {
    const managementStatusResponse: IManagementStatusResponse = await fetchJson(
      `${nodeAddress}${ManagementStatusSuffix}`,
    );
    return managementStatusResponse;
  }

  private async fetchNodeEthereumWriterStatus(nodeAddress: string): Promise<IEthereumWriterStatusResponse> {
    const ethereumWriterStatusResponse: IEthereumWriterStatusResponse = await fetchJson(
      `${nodeAddress}${EthereumWriterStatusSuffix}`,
    );
    return ethereumWriterStatusResponse;
  }
}
