import React from 'react';
import logo from './logo-white.svg';
import Link from '@material-ui/core/Link';
import { NavLink } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';

const HOVER_COLOR = '#16faff';

const styles = theme => ({
  logo: {
    width: 70
  },
  nav: {
    display: 'inherit'
  },
  toolbar: {
    justifyContent: 'space-between'
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 30}px`
  },
  link: {
    color: '#ffffffb3',
    marginLeft: 30,
    transition: 'color 0.4s ease-in-out',
    '&:hover': {
      color: HOVER_COLOR
    }
  }
});

const Header = ({ classes }) => {
  const links = [
    { label: 'Delegates', url: '/delegator' },
    { label: 'Guardians', url: '/guardian' },
    { label: 'Validators', url: '/validator' },
    { label: 'Rewards', url: '/reward' }
  ];
  return (
    <AppBar position="fixed" className={classes.appBar} data-testid="header">
      <Toolbar className={classes.toolbar}>
        <NavLink to="/">
          <img className={classes.logo} src={logo} alt="Orbs" />
        </NavLink>
        <nav className={classes.nav}>
          {links.map(({ label, url }, idx) => (
            <Link
              // @ts-ignore
              component={NavLink}
              key={idx}
              className={classes.link}
              activeStyle={{ color: HOVER_COLOR }}
              underline="none"
              to={url}
              variant="h6"
              noWrap
            >
              {label}
            </Link>
          ))}
        </nav>
      </Toolbar>
    </AppBar>
  );
};

export default withStyles(styles)(Header);
