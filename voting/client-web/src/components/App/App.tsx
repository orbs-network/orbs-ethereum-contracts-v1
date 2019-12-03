/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { WithStyles } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import React from 'react';
import { IConfig } from '../../config';
import { ApiContext } from '../../services/ApiContext';
import { IRemoteService } from '../../services/IRemoteService';
import { MetamaskService } from '../../services/MetamaskService';
import { RemoteService } from '../../services/RemoteService';
import { resources } from '../../translations';
import { Header } from '../Header/Header';
import { Main } from '../Main/Main';
import { LangRouter } from '../multi-lang/LangRouter';
import { AppStyles } from './App.style';
import { ThemeProvider } from './ThemeProvider';

interface IProps extends WithStyles<typeof AppStyles> {
  configs: IConfig;
}

const AppImpl: React.FC<IProps> = ({ configs, classes }) => {
  const remoteService: IRemoteService = new RemoteService(configs.orbsAuditNodeEndpoint);
  const metamask = window['ethereum'] ? new MetamaskService() : undefined;

  return (
    <LangRouter preLangBasename={process.env.PUBLIC_URL} resources={resources}>
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
    </LangRouter>
  );
};

export const App = withStyles(AppStyles)(AppImpl);
