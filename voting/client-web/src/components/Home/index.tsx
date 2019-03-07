import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import { Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  mainText: {
    paddingTop: theme.spacing.unit * 10
  },
  container: {
    display: 'flex',
    width: '100%',
    height: '80vh',
    flexDirection: 'column' as any
  },
  header: {
    textAlign: 'center' as any,
    paddingBottom: 20
  },
  columns: {
    display: 'flex',
    height: '100%'
  },
  column: {
    flex: 1,
    padding: 20,
    textAlign: 'center' as any
  },
  columnText: {
    height: '90%',
    width: '90%',
    margin: '0 auto'
  }
});

const Home = ({ classes }) => {
  return (
    <div className={classes.container}>
      <header className={classes.header}>
        <Typography variant="h3" color="textPrimary" noWrap>
          Who are you?
        </Typography>
      </header>
      <section className={classes.columns}>
        <article className={classes.column}>
          <div className={classes.columnText}>
            <Typography variant="body1">
              Delegators are token holders who assign responsibility for their
              voting stake to Guardians, empowering them to align the network
              with the best interests of the ecosystem. Delegators may also
              proxy their voting stake to another Delegator trusting her to
              choose the right guardian.
            </Typography>
          </div>
          <Button variant="outlined" color="secondary">
            <Link to="/delegator">
              <Typography variant="subtitle1" color="textSecondary">
                Delegate
              </Typography>
            </Link>
          </Button>
        </article>
        <article className={classes.column}>
          <div className={classes.columnText}>
            <Typography variant="body1">
              Guardians are expected to be key players and stakeholders within
              the Universe who align with the long term Orbs vision and play a
              role in making this vision a reality. A core role of the Guardians
              is to review the validators, monitor their operations and approve
              and elect the ideal actors.
            </Typography>
          </div>
          <Button variant="outlined" color="secondary">
            <Link to="/guardian">
              <Typography variant="subtitle1" color="textSecondary">
                Vote
              </Typography>
            </Link>
          </Button>
        </article>
        <article className={classes.column}>
          <div className={classes.columnText}>
            <Typography variant="body1">
              Validators operate the nodes of the Orbs network. They maintain
              the block history and participate in block creation and
              validation. Validators are required to maintain availability and
              connectivity and provide the required quality of service.
              Validators are expected to be technically capable and contribute
              to and support the network’s development.
            </Typography>
          </div>
          <Button variant="outlined" color="secondary">
            <Link to="/">
              <Typography variant="subtitle1" color="textSecondary">
                Explore
              </Typography>
            </Link>
          </Button>
        </article>
      </section>
    </div>
  );
};

export default withStyles(styles)(Home);
