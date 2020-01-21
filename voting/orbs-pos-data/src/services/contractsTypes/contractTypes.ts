import { EventData } from 'web3-eth-contract';

export interface ITypedEventData<T> extends EventData {
  returnValues: T;
}
