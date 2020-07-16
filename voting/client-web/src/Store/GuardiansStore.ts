import { observable, action, reaction, IReactionDisposer, computed, toJS, IObservableArray } from 'mobx';

import { IOrbsPOSDataService, IGuardianInfo, IGuardiansService } from 'orbs-pos-data';
import { PromiEvent, TransactionReceipt } from 'web3-core';
import { normalizeUrl } from '../services/urls';

export type TGuardianInfoExtended = IGuardianInfo & { address: string };

export interface IGuardiansStoreState {
  guardiansList: TGuardianInfoExtended[];
  totalParticipatingTokens: bigint;
}

export type TGuardiansStore = IGuardiansStoreState;

export class GuardiansStore {
  @observable public doneLoading = false;
  @observable public errorLoading = false;
  @observable public guardiansList: IObservableArray<TGuardianInfoExtended> = observable([]);

  @computed get guardiansAddresses(): string[] {
    return this.guardiansList.map(g => g.address.toLowerCase());
  }

  public isGuardian(address: string): boolean {
    return this.guardiansAddresses.includes(address.toLowerCase());
  }

  constructor(private guardiansService: IGuardiansService) {
    this.guardiansList.clear();
  }

  async init() {
    try {
      this.setDoneLoading(false);
      const guardiansAddresses = await this.guardiansService.readGuardiansList(0, 100);
      const promises = guardiansAddresses.map(guardianAddress =>
        this.guardiansService.readGuardianInfo(guardianAddress).then(guardian => {
          // DEV_NOTE : We override the 'website' value that returns to enforce 'http'/'https' at its beginning
          const website = normalizeUrl(guardian.website);
          const guardianInfoExtended: TGuardianInfoExtended = { ...guardian, website, address: guardianAddress };
          this.addGuardianToList(guardianInfoExtended);
        }),
      );

      // TODO : O.L : Decide how to handle error in loading
      // const guardiansInfo = await Promise.all(promises);
      // const guardiansInfoExtended = guardiansInfo.map((g, idx) => ({ ...g, address: guardiansAddresses[idx] }));
      // this.setGuardiansList(guardiansInfoExtended);

      this.setDoneLoading(true);
    } catch (e) {
      this.failLoadingProcess(e);
      console.error('Error while initialising Guardians store', e);
    }
  }

  // ****  Complex setters ****
  private failLoadingProcess(error: Error) {
    this.setErrorLoading(true);
    this.setDoneLoading(true);
  }

  // ****  Observables setter actions ****
  @action('setGuardiansList')
  private setGuardiansList(guardians: TGuardianInfoExtended[]) {
    this.guardiansList.replace(guardians);
  }

  @action('addGuardianToList')
  private addGuardianToList(guardian: TGuardianInfoExtended) {
    this.guardiansList.push(guardian);
  }

  @action('setDoneLoading')
  private setDoneLoading(doneLoading: boolean) {
    this.doneLoading = doneLoading;
  }

  @action('setErrorLoading')
  private setErrorLoading(errorLoading: boolean) {
    this.errorLoading = errorLoading;
  }
}
