import { TUnsubscribeFunction } from '../../services/contractsTypes/contractTypes';
import { ensureAndGetInnerMap, setValueWithUniqueIdAndUnsubscribeFunction } from './testKitHelpers';

export class SingleKeyEventSubscriber<T> {
  private eventsMap: Map<string, Map<number, T>> = new Map();

  public subscribeToEvent(key: string, callback: T): TUnsubscribeFunction {
    const callbacksMapForKey = ensureAndGetInnerMap(this.eventsMap, key);

    return setValueWithUniqueIdAndUnsubscribeFunction(callbacksMapForKey, callback);
  }

  public triggerEventCallbacks(key: string, triggerFunction: (eventCallback: T) => void) {
    if (this.eventsMap.has(key)) {
      const callbacks = this.eventsMap.get(key).values();

      for (const callback of callbacks) {
        triggerFunction(callback);
      }
    }
  }
}
