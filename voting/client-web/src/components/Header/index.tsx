/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import logo from './logo-white.svg';
import Link from '@material-ui/core/Link';
import { NavLink } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import ReadOnlyBanner from '../ReadOnlyBanner';
import styles, { HOVER_COLOR } from './styles';
import Languages from './languages';
import { useTranslation } from 'react-i18next';

const Header = ({ classes, isReadOnly }) => {
  const { t } = useTranslation();
  const links = [
    { label: t('Home'), url: '/' },
    { label: t('Guardians'), url: '/delegator' },
    { label: t('Validators'), url: '/guardian' },
    { label: t('Elected Validators'), url: '/validator' },
    { label: t('Rewards'), url: '/reward' }
  ];

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
        <nav className={classes.nav}>
          {links.map(({ label, url }, idx) => (
            <Link
              // @ts-ignore
              component={NavLink}
              key={idx}
              exact={true}
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
