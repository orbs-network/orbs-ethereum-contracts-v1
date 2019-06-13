/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { withStyles } from '@material-ui/core/styles';
import React from 'react';
import { Route, RouteProps, Switch } from 'react-router-dom';
import { DelegatorsPage } from '../DelegatorsPage/DelegatorsPage';
import { GuardiansPage } from '../Guardrians/GuardiansPage';
import { Home } from '../Home/Home';
import { NewGuardian } from '../NewGuardian/NewGuardian';
import { NewValidator } from '../NewValidator/NewValidator';
import { RewardsPage } from '../RewardsPage/RewardsPage';
import { ValidatorsPage } from '../ValidatorsPage/ValidatorsPage';
import { MainStyles } from './Main.style';

const MainImpl = ({ classes }) => {
  return (
    <main className={classes.content} data-testid='main'>
      <div className={classes.toolbar} />
      <Switch>
        <Route exact path='/' component={Home} />
        <Route exact path='/delegator' component={(props: RouteProps) => <DelegatorsPage />} />
        <Route exact path='/guardian' component={(props: RouteProps) => <GuardiansPage {...props} />} />
        <Route exact path='/validator' component={(props: RouteProps) => <ValidatorsPage {...props} />} />
        <Route exact path='/reward' component={(props: RouteProps) => <RewardsPage {...props} />} />
        <Route exact path='/guardian/new' component={(props: RouteProps) => <NewGuardian {...props} />} />
        <Route exact path='/validator/new' component={(props: RouteProps) => <NewValidator {...props} />} />
      </Switch>
    </main>
  );
};

export const Main = withStyles(MainStyles)(MainImpl);
