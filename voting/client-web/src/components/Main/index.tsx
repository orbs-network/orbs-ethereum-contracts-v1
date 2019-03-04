import React from 'react';
import Home from '../../pages/Home';
import GuardianPage from '../../pages/Guardrians';
import { Route, RouteProps } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import StakeholderPage from '../../pages/Stakeholders';

const styles = theme => ({
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3
  },
  toolbar: theme.mixins.toolbar
});

const Main = ({
  votingContract,
  metamaskService,
  guardiansContract,
  validatorsContract,
  classes
}) => {
  return (
    <main>
      <div className={classes.toolbar} />
      <Route exact path="/" component={Home} />
      <Route
        path="/stakeholder"
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
            votingContract={votingContract}
            metamaskService={metamaskService}
          />
        )}
      />
    </main>
  );
};

export default withStyles(styles)(Main);
