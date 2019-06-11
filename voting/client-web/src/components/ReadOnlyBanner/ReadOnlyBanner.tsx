/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import Link from '@material-ui/core/Link';
import { SnackbarContent } from '@material-ui/core';
import amber from '@material-ui/core/colors/amber';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  container: {
    width: '100%',
  },
  banner: {
    backgroundColor: amber[700],
    width: '100%',
    maxWidth: '100%',
    justifyContent: 'center',
  },
});

const buildMessage = () => {
  return (
    <span>
      Attention! You are in <b>Read Only</b> mode. Please, install{' '}
      <Link href='https://metamask.io' target='_blank' rel='noreferrer'>
        <b>Metamask</b>
      </Link>{' '}
      extensions to unlock full functionality.
    </span>
  );
};

const ReadOnlyBannerImpl = ({ classes }) => {
  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      open={true}
      className={classes.container}
    >
      <SnackbarContent data-testid='read-only-banner' className={classes.banner} message={buildMessage()} />
    </Snackbar>
  );
};

export const ReadOnlyBanner = withStyles(styles)(ReadOnlyBannerImpl);
