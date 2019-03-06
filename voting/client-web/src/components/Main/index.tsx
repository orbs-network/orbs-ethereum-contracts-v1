import React from 'react';
import Home from '../Home';
import GuardianPage from '../Guardrians';
import StakeholderPage from '../Stakeholders';
import { Route, RouteProps } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 5,
    width: '100%'
  },
  toolbar: theme.mixins.toolbar
});

const Main = ({
  votingContract,
  metamaskService,
  guardiansContract,
  validatorsContract,
  validatorsRegistryContract,
  classes
}) => {
  return (
    <main className={classes.content}>
      <div className={classes.toolbar} />
      <Route exact path="/" component={Home} />
      <Route
        path="/delegator"
        component={(props: RouteProps) => (
          <StakeholderPage
            {...props}
            votingContract={votingContract}
            metamaskService={metamaskService}
            guardiansContract={guardiansContract}
          />
        )}
      />
      <Route
        path="/guardian"
        component={(props: RouteProps) => (
          <GuardianPage
            {...props}
            validatorsContract={validatorsContract}
            validatorsRegistryContract={validatorsRegistryContract}
            votingContract={votingContract}
            metamaskService={metamaskService}
          />
        )}
      />
    </main>
  );
};

export default withStyles(styles)(Main);
