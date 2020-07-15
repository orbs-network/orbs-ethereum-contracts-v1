import React from 'react';
import { App } from './App';
import { configs } from '../../config';
import { configureMobx, getStores } from '../../Store/storesInitialization';
import { buildServices } from '../../services/Services';
import Web3 from 'web3';
import { Provider } from 'mobx-react';

configureMobx();

let web3: Web3;

const ethereumProvider = window.ethereum;

if (ethereumProvider) {
  web3 = new Web3(ethereumProvider as any);
} else {
  web3 = new Web3(new Web3.providers.WebsocketProvider(configs.ETHEREUM_PROVIDER_WS));
}

const services = buildServices(web3, ethereumProvider);
const { guardiansService } = services;
const stores = getStores(guardiansService);

export const AppWrapper = React.memo(props => {
  return (
    <Provider {...services} {...stores}>
      <App configs={configs} />
    </Provider>
  );
});
