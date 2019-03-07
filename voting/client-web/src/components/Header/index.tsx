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
    marginLeft: 30,
    display: 'inherit'
  },
  navItem: {
    padding: '0 13px'
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    padding: 8
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
          <Link to="/delegator" className={classes.navItem}>
            <Typography variant="h6" color="secondary" noWrap>
              DELEGATORS
            </Typography>
          </Link>
          <Link to="/guardian" className={classes.navItem}>
            <Typography variant="h6" color="secondary" noWrap>
              GUARDIANS
            </Typography>
          </Link>
          <Link to="/" className={classes.navItem}>
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
