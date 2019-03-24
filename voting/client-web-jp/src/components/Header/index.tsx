import React from 'react';
import logo from './logo-white.svg';
import { NavLink } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import ReadOnlyBanner from '../ReadOnlyBanner';
import styles from './styles';
import Languages from './languages';

const Header = ({ classes, isReadOnly }) => {
  return (
    <AppBar
      position="fixed"
      className={classNames({
        [classes.appBar]: true,
        [classes.movedDown]: isReadOnly
      })}
      data-testid="header"
    >
      {isReadOnly ? <ReadOnlyBanner /> : null}
      <Languages />
      <Toolbar className={classes.toolbar}>
        <NavLink to="/">
          <img className={classes.logo} src={logo} alt="Orbs" />
        </NavLink>
      </Toolbar>
    </AppBar>
  );
};

export default withStyles(styles)(Header);
