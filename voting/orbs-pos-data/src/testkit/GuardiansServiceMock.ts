import { PromiEvent, TransactionReceipt } from 'web3-core';
import { IDelegationInfo } from '../interfaces/IDelegationInfo';
import { IGuardianInfo } from '../interfaces/IGuardianInfo';
import { IGuardiansService } from '../interfaces/IGuardiansService';
import { ITxCreatingServiceMock } from './ITxCreatingServiceMock';
import { TxsMocker } from './TxsMocker';

type TTxCreatingActionNames = 'selectGuardian';

export class GuardiansServiceMock implements IGuardiansService, ITxCreatingServiceMock {
  public readonly txsMocker: TxsMocker<TTxCreatingActionNames>;

  private guardiansList: string[] = [];
  private guardiansMap: Map<string, IGuardianInfo> = new Map();
  private selectedGuardiansMap: Map<string, string> = new Map();

  constructor(autoCompleteTxes: boolean = true) {
    this.txsMocker = new TxsMocker<TTxCreatingActionNames>(autoCompleteTxes);
  }

  // CONFIG //
  setFromAccount(address: string): void {
    this.txsMocker.setFromAccount(address);
  }

  // WRITE (TX creation) //

  selectGuardian(guardianAddress: string): PromiEvent<TransactionReceipt> {
    return this.txsMocker.createTxOf('selectGuardian', () =>
      this.selectedGuardiansMap.set(this.txsMocker.getFromAccount(), guardianAddress),
    );
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

  // Test helpers
  withGuardian(address: string, guardian: IGuardianInfo): this {
    this.guardiansList.push(address);
    this.guardiansMap.set(address, guardian);
    return this;
  }
}
