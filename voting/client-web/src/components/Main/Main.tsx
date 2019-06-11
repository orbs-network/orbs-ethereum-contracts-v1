/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { Home } from '../Home/Home';
import { RewardsPage } from '../RewardsPage/RewardsPage';
import { GuardiansPage } from '../Guardrians/GuardiansPage';
import { NewGuardian } from '../NewGuardian/NewGuardian';
import NewValidator from '../NewValidator';
import { DelegatorsPage } from '../DelegatorsPage/DelegatorsPage';
import { ValidatorsPage } from '../ValidatorsPage/ValidatorsPage';
import { Route, RouteProps, Redirect, Switch } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import styles from './style';

const MainImpl = ({ apiService, classes }) => {
  return (
    <main className={classes.content} data-testid='main'>
      <div className={classes.toolbar} />
      <Switch>
        <Route exact path='/' component={Home} />
        <Route
          exact
          path='/delegator'
          component={(props: RouteProps) => <DelegatorsPage {...props} apiService={apiService} />}
        />
        <Route
          exact
          path='/guardian'
          component={(props: RouteProps) => <GuardiansPage {...props} apiService={apiService} />}
        />
        <Route
          exact
          path='/validator'
          component={(props: RouteProps) => <ValidatorsPage {...props} apiService={apiService} />}
        />
        <Route
          exact
          path='/reward'
          component={(props: RouteProps) => <RewardsPage {...props} apiService={apiService} />}
        />
        <Route
          exact
          path='/guardian/new'
          component={(props: RouteProps) => <NewGuardian {...props} apiService={apiService} />}
        />
        <Route
          exact
          path='/validator/new'
          component={(props: RouteProps) => <NewValidator {...props} apiService={apiService} />}
        />
      </Switch>
    </main>
  );
};

export const Main = withStyles(styles)(MainImpl);
