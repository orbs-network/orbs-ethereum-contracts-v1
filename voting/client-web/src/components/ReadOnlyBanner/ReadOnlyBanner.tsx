/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useMemo } from 'react';
import Snackbar, { SnackbarOrigin } from '@material-ui/core/Snackbar';
import Link from '@material-ui/core/Link';
import { Button, SnackbarContent, StyleRulesCallback } from '@material-ui/core';
import amber from '@material-ui/core/colors/amber';
import { withStyles, WithStyles } from '@material-ui/core';

const styles: StyleRulesCallback = () => ({
  container: {
    width: '100%',
  },
  banner: {
    backgroundColor: amber[700],
    width: '100%',
    maxWidth: '100%',
    justifyContent: 'center',
  },
  actionContainer: {
    // Prevents the action container from 'pushing' the message to the right
    // And anchors it at the end of the snackbar
    position: 'absolute',
    right: '2%',
  },
});

interface IProps extends WithStyles<typeof styles> {
  isOpen: boolean;
  closeBanner(): void;
}

const buildMessage = () => {
  return (
    <span style={{ alignSelf: 'center' }}>
      Attention! You are in <b>Read Only</b> mode. Please, install{' '}
      <Link href='https://metamask.io' target='_blank' rel='noreferrer'>
        <b>Metamask</b>
      </Link>{' '}
      extensions to unlock full functionality.
    </span>
  );
};

const ReadOnlyBannerImpl: React.FC<IProps> = ({ classes, isOpen, closeBanner }) => {
  const anchorOrigin: SnackbarOrigin = useMemo(
    () => ({
      vertical: 'top',
      horizontal: 'center',
    }),
    [],
  );

  const message = useMemo(() => buildMessage(), []);

  const closeButton = useMemo(() => {
    return (
      <Button onClick={closeBanner} color='inherit' size='small'>
        ( Close )
      </Button>
    );
  }, [closeBanner]);

  return (
    <Snackbar anchorOrigin={anchorOrigin} open={isOpen} className={classes.container}>
      <SnackbarContent
        data-testid='read-only-banner'
        classes={{ action: classes.actionContainer, root: classes.banner }}
        role='alertDialog'
        message={message}
        action={closeButton}
      />
    </Snackbar>
  );
};

export const ReadOnlyBanner = withStyles(styles)(ReadOnlyBannerImpl);
