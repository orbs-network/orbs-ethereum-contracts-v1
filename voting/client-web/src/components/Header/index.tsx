import React from 'react';
import logo from './logo.svg';
import { Link } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  logo: {
    width: 140
  },
  nav: {
    display: 'flex',
    marginLeft: 30,
    width: '32%',
    justifyContent: 'space-around'
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  }
});

const Header = ({ classes }) => {
  return (
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar>
        <Link to="/">
          <img className={classes.logo} src={logo} alt="Orbs" />
        </Link>
        <nav className={classes.nav}>
          <Link to="/delegator">
            <Typography variant="h6" color="secondary" noWrap>
              DELEGATORS
            </Typography>
          </Link>
          <Link to="/guardian">
            <Typography variant="h6" color="secondary" noWrap>
              GUARDIANS
            </Typography>
          </Link>
          <Link to="/">
            <Typography variant="h6" color="secondary" noWrap>
              VALIDATORS
            </Typography>
          </Link>
        </nav>
      </Toolbar>
    </AppBar>
  );
};

export default withStyles(styles)(Header);
