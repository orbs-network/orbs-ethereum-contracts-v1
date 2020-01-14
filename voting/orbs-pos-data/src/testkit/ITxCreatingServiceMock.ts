import { TxsMocker } from './TxsMocker';

export interface ITxCreatingServiceMock {
  setAutoCompleteTxes(value: boolean): void;
  txsMocker: TxsMocker<any>;
}
