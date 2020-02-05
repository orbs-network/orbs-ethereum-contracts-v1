import { TUnsubscribeFunction } from '../../services/contractsTypes/contractTypes';

export class EventSubscriber<T> {
  private subscriptionCounter = 0;
  private subscriptionMap: Map<string, Map<number, T>> = new Map();

  public subscribeToEvent(key: string, callback: T): TUnsubscribeFunction {
    const callbacksMapForKey = this.ensureAndGetInnerMap(key);

    return this.setValueWithUniqueIdAndUnsubscribeFunction(callbacksMapForKey, callback);
  }

  public triggerEventCallbacks(key: string, triggerFunction: (eventCallback: T) => void) {
    if (this.subscriptionMap.has(key)) {
      const callbacks = this.subscriptionMap.get(key).values();

      for (const callback of callbacks) {
        triggerFunction(callback);
      }
    }
  }

  private ensureAndGetInnerMap(key: string): Map<number, T> {
    if (!this.subscriptionMap.has(key)) {
      this.subscriptionMap.set(key, new Map());
    }

    return this.subscriptionMap.get(key);
  }

  private setValueWithUniqueIdAndUnsubscribeFunction(map: Map<number, T>, callback: T): TUnsubscribeFunction {
    const uniqueId = this.subscriptionCounter++;

    map.set(uniqueId, callback);

    return () => {
      map.delete(uniqueId);
      return Promise.resolve(true);
    };
  }
}
