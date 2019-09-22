/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import AppBar from '@material-ui/core/AppBar';
import Link from '@material-ui/core/Link';
import { withStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import classNames from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { ReadOnlyBanner } from '../ReadOnlyBanner/ReadOnlyBanner';
import { HeaderStyles, HOVER_COLOR } from './Header.styles';
import { Languages } from './languages';
import logo from './logo-white.svg';
import { Button } from '@material-ui/core';
import { useApi } from '../../services/ApiContext';

const HeaderImpl = ({ classes }) => {
  const { t } = useTranslation();
  const links = [
    { label: t('Home'), url: '/' },
    { label: t('Guardians'), url: '/delegator' },
    { label: t('Validators'), url: '/guardian' },
    { label: t('Elected Validators'), url: '/validator' },
    { label: t('Rewards'), url: '/reward' },
  ];
  const { metamask } = useApi();

  return (
    <AppBar
      position='fixed'
      className={classNames({
        [classes.appBar]: true,
        [classes.movedDown]: !metamask,
      })}
      data-testid='header'
    >
      {!metamask ? <ReadOnlyBanner /> : null}
      <div className={classes.headerButtonsContainer}>
        {metamask && (
          <Button
            size='small'
            variant='outlined'
            color='secondary'
            onClick={() => metamask.displayOrbsInMetamask()}
            className={classes.displayInMetamaskButton}
          >
            {t('Display ORBS in metamask')}
          </Button>
        )}
        <Languages />
      </div>
      <Toolbar className={classes.toolbar}>
        <NavLink to='/'>
          <img className={classes.logo} src={logo} alt='Orbs' />
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
              underline='none'
              to={url}
              variant='h6'
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

export const Header = withStyles(HeaderStyles)(HeaderImpl);
