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
import { ApiService } from '../../api';
import { Mode } from '../../api/interface';
import Header from '../Header';
import { Main } from '../Main/Main';
import i18n from './i18n';
import styles from './style';
import theme from './theme';

function getForcedLanguage() {
  const langMatch = location.pathname.match(/\/(en|ko|jp)\//);
  return langMatch ? langMatch[1] : '';
}

const AppImpl = ({ classes }) => {
  const apiService: ApiService = new ApiService();
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
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <div
            className={classNames({
              [classes.root]: true,
            })}
            data-testid='container'
          >
            <Header isReadOnly={apiService.mode === Mode.ReadOnly} />
            <Main apiService={apiService} />
          </div>
        </MuiThemeProvider>
      </Router>
    </I18nextProvider>
  );
};

export const App = withStyles(styles)(AppImpl);
