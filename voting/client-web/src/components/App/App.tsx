/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { QueryParamProvider } from 'use-query-params';
import { Route } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles } from '@material-ui/core/styles';
import { LangRouter } from '../multi-lang/LangRouter';
import { resources } from '../../translations';
import { Header } from '../Header/Header';
import { Main } from '../Main/Main';
import { HEADER_HEIGHT_REM, ThemeProvider } from './ThemeProvider';
import { useNoMetaMaskSnackbar } from '../ReadOnlyBanner/readOnlyBannerHooks';
import { SnackbarProvider } from 'notistack';

const useStyles = makeStyles((theme) => ({
  rootApp: {
    backgroundColor: '#06142e',
    backgroundRepeat: 'repeat-y',
    backgroundImage: 'url(https://www.orbs.com/wp-content/uploads/2019/02/technology-background1.png)',
    backgroundAttachment: 'scroll',
    backgroundPosition: 'top center',
    minHeight: `calc(100% - ${HEADER_HEIGHT_REM}rem)`,

    // Center the content
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  headerSeparator: {
    height: `${HEADER_HEIGHT_REM}rem`,
  },
  glass: {
    backgroundColor: 'black',
    width: '100%',
    height: '100%',
    opacity: 0.7,
    zIndex: 100000,
    position: 'absolute' as any,
    top: 0,
    left: 0,
  },
  glassLabel: {
    width: '100%',
    height: '100%',
    zIndex: 100001,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute' as any,
    top: 0,
    left: 0,
  },
  blurred: {
    filter: 'blur(2px)',
  },
}));

export const App = React.memo((props) => {
  const classes = useStyles();

  return (
    <LangRouter preLangBasename={process.env.PUBLIC_URL} resources={resources}>
      <QueryParamProvider ReactRouterRoute={Route}>
        <ThemeProvider>
          <SnackbarProvider maxSnack={3}>
            <CssBaseline />
            <Header />
            <div className={classes.headerSeparator} />
            <div className={classes.rootApp} data-testid='container'>
              <Main />
            </div>
          </SnackbarProvider>
        </ThemeProvider>
      </QueryParamProvider>
    </LangRouter>
  );
});
