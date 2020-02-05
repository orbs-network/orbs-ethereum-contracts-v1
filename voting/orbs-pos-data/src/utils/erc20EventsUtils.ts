import { EventData } from 'web3-eth-contract';
import { Subscription } from 'web3-core-subscriptions';

/**
 * If the event is not yet subscribed (and so, has 'id' value of null) the 'unsubscribe' call will not work and the CB will get called.
 * Therefore we will wait until it is connected in order to disconnect it.
 */
export function getUnsubscribePromise(eventEmitter: Subscription<EventData>) {
  let unsubscribePromise: Promise<boolean>;

  if (eventEmitter.id === null) {
    unsubscribePromise = new Promise((resolve, reject) => {
      // @ts-ignore (the 'connected' does not appear in the typing for some reason)
      eventEmitter.on('connected', async () => {
        try {
          await eventEmitter.unsubscribe();
          resolve(true);
        } catch (e) {
          reject(e);
        }
      });
    });
  } else {
    unsubscribePromise = eventEmitter.unsubscribe();
  }

  return unsubscribePromise;
}
