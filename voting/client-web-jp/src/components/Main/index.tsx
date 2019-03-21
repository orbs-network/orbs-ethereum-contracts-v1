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
