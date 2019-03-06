import React from 'react';
import { Link } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  mainText: {
    paddingTop: theme.spacing.unit * 10
  }
});

const Home = ({ classes }) => {
  return (
    <Grid container justify="center">
      <Grid item>
        <Typography variant="h3" color="textPrimary" noWrap>
          Who are you?
        </Typography>
      </Grid>
      <Grid
        container
        spacing={16}
        justify="center"
        direction="row"
        className={classes.mainText}
      >
        <Grid item xs={4}>
          <Typography variant="body1">
            Delegators are token holders who assign responsibility for their
            voting stake to Guardians, empowering them to align the network with
            the best interests of the ecosystem. Delegators may also proxy their
            voting stake to another Delegator trusting her to choose the right
            guardian.
          </Typography>
          <Button variant="outlined" color="secondary">
            <Link to="/delegator">
              <Typography variant="subtitle1" color="textSecondary">
                Delegate
              </Typography>
            </Link>
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body1">
            Guardians are expected to be key players and stakeholders within the
            Universe who align with the long term Orbs vision and play a role in
            making this vision a reality. A core role of the Guardians is to
            review the validators, monitor their operations and approve and
            elect the ideal actors.
          </Typography>
          <Button variant="outlined" color="secondary">
            <Link to="/guardian">
              <Typography variant="subtitle1" color="textSecondary">
                Vote
              </Typography>
            </Link>
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body1">
            Validators operate the nodes of the Orbs network. They maintain the
            block history and participate in block creation and validation.
            Validators are required to maintain availability and connectivity
            and provide the required quality of service. Validators are expected
            to be technically capable and contribute to and support the
            network’s development.
          </Typography>
          <Button variant="outlined" color="secondary">
            <Link to="/">
              <Typography variant="subtitle1" color="textSecondary">
                Explore
              </Typography>
            </Link>
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withStyles(styles)(Home);
