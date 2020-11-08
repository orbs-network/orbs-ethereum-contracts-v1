import { configure } from 'mobx';
import { IStores } from './stores';

// This import ensures mobx batching
import 'mobx-react-lite/batchingForReactDom';
import { IGuardiansService } from 'orbs-pos-data';
import { GuardiansStore } from './GuardiansStore';
import { IOrbsNodeService } from '../services/v2/orbsNodeService/IOrbsNodeService';
import { OrbsNodeStore } from './OrbsNodeStore';

/**
 * Configures the mobx library. Should get called at App's initialization.
 */
export function configureMobx() {
  configure({
    enforceActions: 'observed',
  });
}

/**
 * Builds and initializes all of the stores
 */
export function getStores(guardiansService: IGuardiansService, orbsNodeService: IOrbsNodeService): IStores {
  // Create stores instances + Hydrate the stores

  const stores: IStores = {
    guardiansStore: new GuardiansStore(guardiansService),
    orbsNodeStore: new OrbsNodeStore(orbsNodeService),
  };

  // TODO : O.L : add proper handling of errors here
  stores.guardiansStore.init();

  return stores;
}
