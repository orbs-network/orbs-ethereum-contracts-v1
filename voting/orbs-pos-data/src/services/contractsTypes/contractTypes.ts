import { EventData } from 'web3-eth-contract';

export interface ITypedEventData<T> extends EventData {
  returnValues: T;
}

export type TUnsubscribeFunction = () => Promise<boolean>;
