import axios from 'axios';
import { IApiStrategy, Strategies } from './interface';

const remoteAddress = 'https://orbs-voting-proxy-server.herokuapp.com/api';

export class RemoteStrategy implements IApiStrategy {
  type = Strategies.remote;
  getGuardians() {
    return axios.get(`${remoteAddress}/guardians`).then(res => res.data);
  }
  getGuardianData(address) {
    return axios
      .get(`${remoteAddress}/guardians/${address}`)
      .then(res => res.data);
  }
  getValidators() {
    return axios.get(`${remoteAddress}/validators`).then(res => res.data);
  }
  getValidatorData(address) {
    return axios
      .get(`${remoteAddress}/validators/${address}`)
      .then(res => res.data);
  }
}
