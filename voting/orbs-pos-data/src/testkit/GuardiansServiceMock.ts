import { PromiEvent, TransactionReceipt } from 'web3-core';
import { IDelegationInfo } from '../interfaces/IDelegationInfo';
import { IGuardianInfo } from '../interfaces/IGuardianInfo';
import { GuardiansServiceDelegateEventCallback, IGuardiansService } from '../interfaces/IGuardiansService';
import { ITxCreatingServiceMock } from './ITxCreatingServiceMock';
import { TxsMocker } from './TxsMocker';
import { EventSubscriber } from './utils/EventSubscriber';

type TTxCreatingActionNames = 'selectGuardian';

export class GuardiansServiceMock implements IGuardiansService, ITxCreatingServiceMock {
  public readonly txsMocker: TxsMocker<TTxCreatingActionNames>;

  private votingContractDelegationCounter = 0;
  private guardiansList: string[] = [];
  private guardiansMap: Map<string, IGuardianInfo> = new Map();
  private selectedGuardiansMap: Map<string, string> = new Map();
  private delegateEventsSubscriber: EventSubscriber<GuardiansServiceDelegateEventCallback> = new EventSubscriber();

  constructor(autoCompleteTxes: boolean = true) {
    this.txsMocker = new TxsMocker<TTxCreatingActionNames>(autoCompleteTxes);
  }

  // CONFIG //
  setFromAccount(address: string): void {
    this.txsMocker.setFromAccount(address);
  }

  // WRITE (TX creation) //

  selectGuardian(guardianAddress: string): PromiEvent<TransactionReceipt> {
    const ownerAddress = this.txsMocker.getFromAccount();

    const txEffect = () => {
      this.selectedGuardiansMap.set(this.txsMocker.getFromAccount(), guardianAddress),
        this.votingContractDelegationCounter++;
      this.delegateEventsSubscriber.triggerEventCallbacks(ownerAddress, eventCallback =>
        eventCallback(null, ownerAddress, guardianAddress, this.votingContractDelegationCounter),
      );
    };

    return this.txsMocker.createTxOf('selectGuardian', txEffect);
  }

  // READ //
  async readSelectedGuardianAddress(accountAddress: string): Promise<string> {
    return this.selectedGuardiansMap.get(accountAddress) || null;
  }

  async readDelegationInfo(address: string): Promise<IDelegationInfo> {
    return null;
  }
  async readGuardiansList(offset: number, limit: number): Promise<string[]> {
    return this.guardiansList;
  }

  async readGuardianInfo(guardianAddress: string): Promise<IGuardianInfo> {
    return this.guardiansMap.get(guardianAddress);
  }

  // Events Subscriptions //
  subscribeToDelegateEvent(
    stakeOwner: string,
    callback: (error: Error, delegator: string, delegate: string, delegationCounter: number) => void,
  ): () => Promise<boolean> {
    return this.delegateEventsSubscriber.subscribeToEvent(stakeOwner, callback);
  }

  // Test helpers //
  withGuardian(address: string, guardian: IGuardianInfo): this {
    this.guardiansList.push(address);
    this.guardiansMap.set(address, guardian);
    return this;
  }

  withSelectedGuardian(delegator: string, delegatee: string) {
    this.selectedGuardiansMap.set(delegator, delegatee);
  }
}
