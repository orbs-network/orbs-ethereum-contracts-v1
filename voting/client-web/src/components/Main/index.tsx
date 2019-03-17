import React from 'react';
import Home from '../Home';
import NewGuardian from '../NewGuardian';
import NewValidator from '../NewValidator';
import GuardianPage from '../Guardrians';
import DelegatorsPage from '../Delegators';
import ValidatorsPage from '../Validators';
import { Route, RouteProps } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import styles from './style';

const Main = ({ apiService, classes }) => {
  return (
    <main className={classes.content} data-testid="main">
      <div className={classes.toolbar} />
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
      <Route
        exact
        path="/validator"
        component={(props: RouteProps) => (
          <ValidatorsPage {...props} apiService={apiService} />
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
    </main>
  );
};

export default withStyles(styles)(Main);
