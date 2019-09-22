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

const ORB_ERC20_CONTRACT_ADDRESS = '0xff56cc6b1e6ded347aa0b7676c85ab0b3d08b0fa';

const HeaderImpl = ({ classes, metamaskInstalled }) => {
  const { t } = useTranslation();
  const links = [
    { label: t('Home'), url: '/' },
    { label: t('Guardians'), url: '/delegator' },
    { label: t('Validators'), url: '/guardian' },
    { label: t('Elected Validators'), url: '/validator' },
    { label: t('Rewards'), url: '/reward' },
  ];

  function displayInMetamask() {
    (window as any).web3.currentProvider.sendAsync({
      method: 'metamask_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          symbol: 'ORBS',
          address: ORB_ERC20_CONTRACT_ADDRESS,
          decimals: 18,
          image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3835.png',
        },
      },
    });
  }
  return (
    <AppBar
      position='fixed'
      className={classNames({
        [classes.appBar]: true,
        [classes.movedDown]: !metamaskInstalled,
      })}
      data-testid='header'
    >
      {!metamaskInstalled ? <ReadOnlyBanner /> : null}
      <div className={classes.topRight}>
        {metamaskInstalled && (
          <Button
            size='small'
            variant='outlined'
            color='secondary'
            onClick={displayInMetamask}
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
