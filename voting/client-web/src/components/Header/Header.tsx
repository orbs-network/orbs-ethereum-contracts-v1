/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import AppBar from '@material-ui/core/AppBar';
import Link from '@material-ui/core/Link';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { ReadOnlyBanner } from '../ReadOnlyBanner/ReadOnlyBanner';
import { Languages } from './languages';
import logo from './logo-white.svg';
import { Button } from '@material-ui/core';
import { useApi } from '../../services/ApiContext';

export const HOVER_COLOR = '#16faff';

const useStyles = makeStyles(theme => ({
  logo: {
    width: 70,
  },
  nav: {
    display: 'inherit',
  },
  toolbar: {
    justifyContent: 'space-between',
  },
  headerButtonsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    padding: `${theme.spacing(2)}px ${theme.spacing(8)}px`,
  },
  displayInMetamaskButton: {
    marginRight: `${theme.spacing(3)}px`,
  },
  movedDown: {
    paddingTop: 48,
  },
  link: {
    color: '#ffffffb3',
    marginLeft: 30,
    transition: 'color 0.4s ease-in-out',
    '&:hover': {
      color: HOVER_COLOR,
    },
  },
}));

// const HeaderImpl = ({ classes }) => {
export const Header = React.memo(props => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { metamask } = useApi();
  const hasMetamask = useMemo(() => !!metamask, [metamask]);
  const [isNoMetamaskBannerOpen, setIsMetamaskBannerOpen] = useState(!hasMetamask);
  const hideMetaMaskBanner = useCallback(() => setIsMetamaskBannerOpen(false), [setIsMetamaskBannerOpen]);

  const links = [
    { label: t('Home'), url: '/' },
    { label: t('Guardians'), url: '/delegator' },
    { label: t('Validators'), url: '/guardian' },
    { label: t('Elected Validators'), url: '/validator' },
    { label: t('Rewards'), url: '/reward' },
  ];

  return (
    <AppBar
      position='fixed'
      className={classNames({
        [classes.appBar]: true,
        [classes.movedDown]: isNoMetamaskBannerOpen, // Add header padding so the banner will not hide the content
      })}
      data-testid='header'
    >
      {/* MetaMask banner */}
      <ReadOnlyBanner isOpen={isNoMetamaskBannerOpen} closeBanner={hideMetaMaskBanner} />

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
});
