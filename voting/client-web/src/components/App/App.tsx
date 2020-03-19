/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { QueryParamProvider } from 'use-query-params';
import { Route } from 'react-router-dom';
import classNames from 'classnames';
import Web3 from 'web3';
import { WithStyles } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { withStyles } from '@material-ui/core/styles';
import { LangRouter } from '../multi-lang/LangRouter';
import { IConfig } from '../../config';
import { ApiContext } from '../../services/ApiContext';
import { IRemoteService } from '../../services/IRemoteService';
import { MetamaskService } from '../../services/MetamaskService';
import { RemoteService } from '../../services/RemoteService';
import { resources } from '../../translations';
import { Header } from '../Header/Header';
import { Main } from '../Main/Main';
import { AppStyles } from './App.style';
import { ThemeProvider } from './ThemeProvider';
import { configs } from '../../config';

interface IProps extends WithStyles<typeof AppStyles> {
  configs: IConfig;
}

const AppImpl: React.FC<IProps> = ({ configs, classes }) => {
  // TODO : O.L : FUTRUE : Move the service initialization to a separate file
  let web3: Web3;

  const ethereumProvider = window.ethereum;

  if (ethereumProvider) {
    web3 = new Web3(ethereumProvider as any);
  } else {
    web3 = new Web3(new Web3.providers.WebsocketProvider(configs.ETHEREUM_PROVIDER_WS));
  }

  const remoteService: IRemoteService = new RemoteService(configs.orbsAuditNodeEndpoint);
  // TODO : FUTURE: O.L : This method of signaling no meta-mask is too fragile and unclear, change it to be like staking wallet
  const metamask = ethereumProvider ? new MetamaskService(web3) : undefined;

  return (
    <LangRouter preLangBasename={process.env.PUBLIC_URL} resources={resources}>
      <QueryParamProvider ReactRouterRoute={Route}>
        <ThemeProvider>
          <ApiContext.Provider value={{ remoteService, metamask }}>
            <CssBaseline />
            <div
              className={classNames({
                [classes.root]: true,
              })}
              data-testid='container'
            >
              <Header />
              <Main />
            </div>
          </ApiContext.Provider>
        </ThemeProvider>
      </QueryParamProvider>
    </LangRouter>
  );
};

export const App = withStyles(AppStyles)(AppImpl);
