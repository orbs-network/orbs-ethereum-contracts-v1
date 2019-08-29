import axios from 'axios';
import { IRemoteService } from './IRemoteService';

// const remoteAddress = 'http://localhost:5678/api';
const remoteAddress = 'https://orbs-voting-proxy-server.herokuapp.com/api';

export class RemoteService implements IRemoteService {
  private async callRemote(path: string, params?: any) {
    const config = params ? { params } : undefined;
    const res = await axios.get(`${remoteAddress}${path}`, config);
    return res.data;
  }

  getGuardians() {
    return this.callRemote('/guardians', { limit: 100, offset: 0 });
  }

  getGuardianData(address: string) {
    return this.callRemote(`/guardians/${address}`);
  }

  getValidators() {
    return this.callRemote(`/validators`);
  }

  getElectedValidators() {
    return this.callRemote(`/validators/elected`);
  }

  getValidatorData(address: string) {
    return this.callRemote(`/validators/${address}`);
  }

  getElectedValidatorData(address: string) {
    return this.callRemote(`/validators/elected/${address}`);
  }

  getRewards(address: string) {
    return this.callRemote(`/rewards/${address}`);
  }

  getRewardsHistory(address: string) {
    return this.callRemote(`/rewards/history/${address}`);
  }

  getTotalParticipatingTokens() {
    return this.callRemote(`/total-participating-tokens`);
  }

  getNextElectionBlockNumber() {
    return this.callRemote(`/elections/next`);
  }

  getPastElectionBlockNumber() {
    return this.callRemote(`/elections/past`);
  }

  getCurrentDelegation(address: string) {
    return this.callRemote(`/delegation/status`, { address });
  }

  getCurrentDelegationInfo(address: string) {
    return this.callRemote(`/delegation`, { address });
  }
}
