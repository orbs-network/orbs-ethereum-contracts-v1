import React from 'react';
import { MobXProviderContext } from 'mobx-react';
import { IStores } from './stores';
import { GuardiansStore } from './GuardiansStore';
import { OrbsNodeStore } from './OrbsNodeStore';

export function useStores(): IStores {
  // @ts-ignore
  return React.useContext(MobXProviderContext);
}

export function useGuardiansStore(): GuardiansStore {
  // return useStores().guardiansStore;
  // @ts-ignore
  return null;
}

export function useOrbsNodeStore(): OrbsNodeStore {
  // return useStores().orbsNodeStore;
  // @ts-ignore
  return null;
}
