// DEV_NOTE : This store will keep all data that is read from an orbs node.

import { IOrbsNodeService } from '../services/v2/orbsNodeService/IOrbsNodeService';
import { action, computed, observable } from 'mobx';
import { Guardian, SystemState } from '../services/v2/orbsNodeService/systemState';
import { ICommitteeMemberData, IReadAndProcessResults } from '../services/v2/orbsNodeService/OrbsNodeTypes';

export class OrbsNodeStore {
  @observable public doneLoading = false;
  @observable public errorLoading = false;
  @observable public systemState: SystemState = new SystemState();
  @observable public committeeMembers: ICommitteeMemberData[] = [];

  @computed public get committeeGuardians(): Guardian[] {
    return Object.values(this.systemState.CommitteeNodes);
  }

  @computed public get nonCommitteeGuardians(): Guardian[] {
    return Object.values(this.systemState.StandByNodes);
  }

  @computed public get guardians(): Guardian[] {
    return [...this.committeeGuardians, ...this.nonCommitteeGuardians];
  }

  /**
   * Returns all addresses in lower case.
   */
  @computed public get guardiansAddresses(): string[] {
    return this.guardians.map((guardian) => guardian.EthAddress.toLowerCase());
  }

  @computed public get committeeEffectiveStake(): number {
    const committeeEffectiveStake = this.committeeGuardians.reduce((sum, committeeGuardian) => {
      return sum + committeeGuardian.EffectiveStake;
    }, 0);

    return committeeEffectiveStake;
  }

  @computed public get totalStake(): number {
    const totalStake = this.guardians.reduce((sum, committeeGuardian) => {
      return sum + committeeGuardian.EffectiveStake;
    }, 0);

    return totalStake;
  }

  @computed public get currentGuardiansAnnualRewardsInterest(): number {
    const committeeStake = this.committeeEffectiveStake;

    // TODO : ORL : Fix this calculation after speaking with Oded
    const maxInterestForGuardians = 12;
    const percentageFromMax = (80_000_000 / committeeStake) * 100;

    const rewardsInterest = Math.min(maxInterestForGuardians, percentageFromMax);

    return rewardsInterest;
  }

  @computed public get currentDelegatorsAnnualRewardsInterest(): number {
    const ratioFromGuardians = 2 / 3;
    const currentInterest = ratioFromGuardians * this.currentGuardiansAnnualRewardsInterest;

    return +currentInterest.toFixed(2);
  }

  constructor(private orbsNodeService: IOrbsNodeService) {
    this.readAllData();
  }

  // ****  Data reading ****

  private async readAllData() {
    this.setDoneLoading(false);
    this.setErrorLoading(false);
    try {
      await this.findReadAndSetNodeData();

      this.setDoneLoading(true);
    } catch (e) {
      this.setErrorLoading(true);
    }
  }

  private async findReadAndSetNodeData() {
    const { systemState, committeeMembers } = await this.readDataFromFirstSyncedNode();

    this.setSystemState(systemState);
    this.setCommitteeMemberData(committeeMembers);
  }

  private async readDataFromFirstSyncedNode(): Promise<IReadAndProcessResults> {
    const defaultNodeProcessedResponse = await this.readDefaultNodeData();

    if (defaultNodeProcessedResponse) {
      return defaultNodeProcessedResponse;
    } else {
      return this.findSyncedCommitteeAndReadData();
    }
  }

  private async readDefaultNodeData(): Promise<IReadAndProcessResults | null> {
    // Check if default node is in sync
    const isDefaultNodeAtSync = await this.orbsNodeService.checkIfDefaultNodeIsInSync();

    if (!isDefaultNodeAtSync) {
      // TODO : ORL : Add analytic
      console.log('Default node is not in sync');
      return null;
    } else {
      try {
        const readAndProcessResult = await this.orbsNodeService.readAndProcessSystemState(
          this.orbsNodeService.defaultNodeAddress,
        );

        return readAndProcessResult;
      } catch (e) {
        console.log(`Error while reading and processing default node : ${e}`);
        return null;
      }
    }
  }

  private async findSyncedCommitteeAndReadData(): Promise<IReadAndProcessResults> {
    // TODO : O.L : Fix this
    // @ts-ignore
    return null;
  }

  // ****  Observables setter actions ****
  @action('setDoneLoading')
  private setDoneLoading(doneLoading: boolean) {
    this.doneLoading = doneLoading;
  }

  @action('setErrorLoading')
  private setErrorLoading(errorLoading: boolean) {
    this.errorLoading = errorLoading;
  }

  @action('setSystemState')
  private setSystemState(systemState: SystemState) {
    this.systemState = systemState;
  }

  @action('setCommitteeMemberData')
  private setCommitteeMemberData(committeeMembers: ICommitteeMemberData[]) {
    this.committeeMembers = committeeMembers;
  }
}
