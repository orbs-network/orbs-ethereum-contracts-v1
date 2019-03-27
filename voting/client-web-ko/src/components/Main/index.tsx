/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import DelegatorsPage from '../Delegators';
import { Route, RouteProps } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import styles from './style';

const Main = ({ apiService, classes }) => {
  return (
    <main className={classes.content} data-testid="main">
      <div className={classes.toolbar} />
      <Route
        exact
        path="/"
        component={(props: RouteProps) => (
          <DelegatorsPage {...props} apiService={apiService} />
        )}
      />
    </main>
  );
};

export default withStyles(styles)(Main);
