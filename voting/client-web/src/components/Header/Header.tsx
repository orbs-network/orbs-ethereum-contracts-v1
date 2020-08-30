/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import AppBar from '@material-ui/core/AppBar';
import Link from '@material-ui/core/Link';
import { makeStyles, useTheme, withStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { ReadOnlyBanner } from '../ReadOnlyBanner/ReadOnlyBanner';
import { Languages } from './languages';
import logo from './logo-white.svg';
import { Button, IconButton, useMediaQuery } from '@material-ui/core';
import { useApi } from '../../services/ApiContext';
import { HEADER_HEIGHT_REM } from '../App/ThemeProvider';
import { MenuPopup } from './MenuPopup';
import { useLinkDescriptors } from './links';

export const HOVER_COLOR = '#16faff';

const useStyles = makeStyles((theme) => ({
  appBar: {
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    boxSizing: 'border-box',
    height: `${HEADER_HEIGHT_REM}rem`,
    zIndex: theme.zIndex.drawer + 1,
    // padding: `${theme.spacing(2)}px ${theme.spacing(8)}px`,
    // padding: theme.spacing(1),
  },
  logo: {
    width: 70,
  },
  nav: {
    display: 'inherit',
    flexWrap: 'wrap',
  },
  toolbar: {
    paddingRight: 0,
    paddingLeft: 0,
    // marginRight: 'auto',
    // marginLeft: 'auto',
    margin: 'auto',
    width: '90%',
    maxWidth: '90%',
    justifyContent: 'space-between',
  },
  headerButtonsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    margin: 'auto',
    width: '90%',
    maxWidth: '90%',
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

// TODO : O.L : Fix the snackbar hiding the header
export const Header = React.memo((props) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { metamask } = useApi();
  // const hasMetamask = useMemo(() => !!metamask, [metamask]);
  // const [isNoMetamaskBannerOpen, setIsMetamaskBannerOpen] = useState(!hasMetamask);
  // const hideMetaMaskBanner = useCallback(() => setIsMetamaskBannerOpen(false), [setIsMetamaskBannerOpen]);

  const theme = useTheme();
  const smallerThanSmall = useMediaQuery(theme.breakpoints.down('xs'));
  const linkDescriptors = useLinkDescriptors();

  // C.F.H : add proper menu for smaller screens

  const menuLinks = useMemo(() => {
    return linkDescriptors.map(({ label, url }, idx) => (
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
    ));
  }, [classes.link, linkDescriptors]);

  const menu = useMemo(() => {
    if (smallerThanSmall) {
      return <MenuPopup />;
    } else {
      return <nav className={classes.nav}>{menuLinks}</nav>;
    }
  }, [classes.nav, menuLinks, smallerThanSmall]);

  return (
    <AppBar
      position='fixed'
      className={classNames({
        [classes.appBar]: true,
        // [classes.movedDown]: isNoMetamaskBannerOpen, // Add header padding so the banner will not hide the content
      })}
      data-testid='header'
    >
      {/* MetaMask banner */}
      {/*<ReadOnlyBanner isOpen={isNoMetamaskBannerOpen} closeBanner={hideMetaMaskBanner} />*/}

      <div className={classes.headerButtonsContainer}>
        {metamask && !smallerThanSmall && (
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
        {menu}
      </Toolbar>
    </AppBar>
  );
});
