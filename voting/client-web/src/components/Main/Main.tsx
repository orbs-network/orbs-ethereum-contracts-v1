/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { makeStyles, withStyles } from '@material-ui/core/styles';
import React from 'react';
import { Route, RouteProps, Switch } from 'react-router-dom';
import { DelegatorsPage } from '../../pages/DelegatorsPage/DelegatorsPage';
import { GuardiansPage } from '../Guardrians/GuardiansPage';
import { Home } from '../Home/Home';
import { NewGuardian } from '../NewGuardian/NewGuardian';
import { NewValidator } from '../NewValidator/NewValidator';
import { RewardsPage } from '../../pages/RewardsPage/RewardsPage';
import { ValidatorsPage } from '../../pages/ValidatorsPage/ValidatorsPage';
import { useNoMetaMaskSnackbar } from '../ReadOnlyBanner/readOnlyBannerHooks';

const useStyles = makeStyles((theme) => ({
  content: {
    // flexGrow: 1,
    maxWidth: '90%',
    boxSizing: 'border-box',
    padding: theme.spacing(1),
    // overflow: 'hidden',
  },
}));

export const Main = React.memo((props) => {
  const classes = useStyles();
  useNoMetaMaskSnackbar();
  return (
    <main className={classes.content} data-testid='main'>
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
});
