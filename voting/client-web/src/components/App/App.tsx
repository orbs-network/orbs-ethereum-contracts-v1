/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import CssBaseline from '@material-ui/core/CssBaseline';
import { MuiThemeProvider, withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter as Router } from 'react-router-dom';
import { ApiContext } from '../../services/ApiContext';
import { IRemoteService } from '../../services/IRemoteService';
import { RemoteService } from '../../services/RemoteService';
import { Header } from '../Header/Header';
import { Main } from '../Main/Main';
import { AppStyles } from './App.style';
import { AppTheme } from './App.theme';
import i18n from './i18n';
import { MetamaskService } from '../../services/MetamaskService';
import { WithStyles } from '@material-ui/core';
import { IConfig } from '../../config';
function getForcedLanguage() {
  const langMatch = location.pathname.match(/\/(en|ko|jp)\//);
  return langMatch ? langMatch[1] : '';
}

interface IProps extends WithStyles<typeof AppStyles> {
  configs: IConfig;
}

const AppImpl: React.FC<IProps> = ({ configs, classes }) => {
  const remoteService: IRemoteService = new RemoteService(configs.orbsAuditNodeEndpoint);
  const metamask = window['ethereum'] ? new MetamaskService() : undefined;
  const forcedLang = getForcedLanguage();
  let langBaseName = '';
  if (forcedLang) {
    langBaseName = `/${forcedLang}/`;
    if (i18n.language !== forcedLang) {
      i18n.changeLanguage(forcedLang);
    }
  } else {
    const navigatorLang = navigator.language.split('-')[0];
    if (['en', 'jp', 'ko'].indexOf(navigatorLang) > -1) {
      if (i18n.language !== navigatorLang) {
        i18n.changeLanguage(navigatorLang);
      }
    }
  }

  return (
    <I18nextProvider i18n={i18n}>
      <Router basename={`${process.env.PUBLIC_URL}${langBaseName}`}>
        <MuiThemeProvider theme={AppTheme(i18n.language)}>
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
        </MuiThemeProvider>
      </Router>
    </I18nextProvider>
  );
};

export const App = withStyles(AppStyles)(AppImpl);
