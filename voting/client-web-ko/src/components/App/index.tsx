/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import Main from '../Main';
import Header from '../Header';
import CssBaseline from '@material-ui/core/CssBaseline';
import { BrowserRouter as Router } from 'react-router-dom';
import { MuiThemeProvider, withStyles } from '@material-ui/core/styles';
import theme from './theme';
import styles from './style';
import classNames from 'classnames';
import { ApiService } from '../../api';
import { Mode } from '../../api/interface';
import { Typography } from '@material-ui/core';

const App = ({ classes }) => {
  const apiService: ApiService = new ApiService();
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {apiService.isMainNet() && (
          <>
            <div className={classes.glass} />
            <div className={classes.glassLabel}>
              <Typography variant="h1">COMING SOON</Typography>
            </div>
          </>
        )}
        <div
          className={classNames({
            [classes.root]: true,
            [classes.blurred]: apiService.isMainNet()
          })}
          data-testid="container"
        >
          <Header isReadOnly={apiService.mode === Mode.ReadOnly} />
          <Main apiService={apiService} />
        </div>
      </MuiThemeProvider>
    </Router>
  );
};

export default withStyles(styles)(App);
