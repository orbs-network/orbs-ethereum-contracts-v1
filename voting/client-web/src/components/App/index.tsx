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
import Main from '../Main';
import i18n from './i18n';
import styles from './style';
import theme from './theme';

const App = ({ classes }) => {
  const apiService: ApiService = new ApiService();
  return (
    <I18nextProvider i18n={i18n}>
      <Router basename={`${process.env.PUBLIC_URL}`}>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <div
            className={classNames({
              [classes.root]: true
            })}
            data-testid="container"
          >
            <Header isReadOnly={apiService.mode === Mode.ReadOnly} />
            <Main apiService={apiService} />
          </div>
        </MuiThemeProvider>
      </Router>
    </I18nextProvider>
  );
};

export default withStyles(styles)(App);
