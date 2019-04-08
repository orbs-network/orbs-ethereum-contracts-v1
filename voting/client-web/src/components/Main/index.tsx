/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import Home from '../Home';
import RewardsPage from '../Rewards';
import GuardianPage from '../Guardrians';
import NewGuardian from '../NewGuardian';
import NewValidator from '../NewValidator';
import DelegatorsPage from '../Delegators';
import ValidatorsPage from '../Validators';
import { Route, RouteProps, Redirect, Switch } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import styles from './style';

const Main = ({ apiService, classes }) => {
  return (
    <main className={classes.content} data-testid="main">
      <div className={classes.toolbar} />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route
          exact
          path="/delegator"
          component={(props: RouteProps) => (
            <DelegatorsPage {...props} apiService={apiService} />
          )}
        />
        <Route
          exact
          path="/guardian"
          component={(props: RouteProps) => (
            <GuardianPage {...props} apiService={apiService} />
          )}
        />
        <Redirect exact from="/validator" to="/" />
        <Route
          exact
          path="/validator"
          component={(props: RouteProps) => (
            <ValidatorsPage {...props} apiService={apiService} />
          )}
        />
        <Redirect exact from="/reward" to="/" />
        <Route
          exact
          path="/reward"
          component={(props: RouteProps) => (
            <RewardsPage {...props} apiService={apiService} />
          )}
        />
        <Route
          exact
          path="/guardian/new"
          component={(props: RouteProps) => (
            <NewGuardian {...props} apiService={apiService} />
          )}
        />
        <Route
          exact
          path="/validator/new"
          component={(props: RouteProps) => (
            <NewValidator {...props} apiService={apiService} />
          )}
        />
      </Switch>
    </main>
  );
};

export default withStyles(styles)(Main);
