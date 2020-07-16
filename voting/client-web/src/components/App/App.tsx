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
import { WithStyles } from '@material-ui/core';
import CssBaseline from '@material-ui/core/CssBaseline';
import { withStyles } from '@material-ui/core/styles';
import { LangRouter } from '../multi-lang/LangRouter';
import { IConfig } from '../../config';
import { ApiContext } from '../../services/ApiContext';
import { resources } from '../../translations';
import { Header } from '../Header/Header';
import { Main } from '../Main/Main';
import { AppStyles } from './App.style';
import { ThemeProvider } from './ThemeProvider';
import { useServices } from '../../services/ServicesHooks';

interface IProps extends WithStyles<typeof AppStyles> {
  configs: IConfig;
}

const AppImpl: React.FC<IProps> = ({ configs, classes }) => {
  const services = useServices();

  const { orbsRewardsService, metamask, remoteService, guardiansService, stakingService } = services;

  return (
    <LangRouter preLangBasename={process.env.PUBLIC_URL} resources={resources}>
      <QueryParamProvider ReactRouterRoute={Route}>
        <ThemeProvider>
          {/* DEV_NOTE : O.L : This provider is the old-form manual provider */}
          {/* TODO : O.L: Change all services to use the standard provider and hooks */}
          <ApiContext.Provider
            value={{ remoteService, metamask, stakingService, guardiansService, orbsRewardsService }}
          >
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
