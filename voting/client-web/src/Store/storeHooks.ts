import React from 'react';
import { MobXProviderContext } from 'mobx-react';
import { IStores } from './stores';
import { GuardiansStore } from './GuardiansStore';

export function useStores(): IStores {
  // @ts-ignore
  return React.useContext(MobXProviderContext);
}

export function useGuardiansStore(): GuardiansStore {
  return useStores().guardiansStore;
}
