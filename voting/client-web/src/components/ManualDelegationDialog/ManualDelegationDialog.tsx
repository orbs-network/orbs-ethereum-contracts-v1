/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import { withStyles } from '@material-ui/core/styles';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import { useTranslation } from 'react-i18next';

const styles = () => ({});

const DelegateButton = ({ onDelegate }) => {
  const { t } = useTranslation();
  return (
    <Button data-testid={`delegate-button`} onClick={onDelegate} variant='outlined' color='secondary'>
      {t('Delegate')}
    </Button>
  );
};

const ManualDelegationDialogImpl = ({ dialogState, onClose, onDelegate }) => {
  const [delegatorAddress, setDelegatorAddress] = useState('');

  const { t } = useTranslation();
  return (
    <Dialog open={dialogState} onClose={onClose} maxWidth='lg' fullWidth={true}>
      <DialogTitle>{t('Manually Delegate Your Stake')}</DialogTitle>
      <DialogContent data-testid='manual-delegation-dialog'>
        <Typography variant='body1' color='textPrimary'>
          {t('Manual Delegation Description')}
        </Typography>
        <TextField
          required
          data-testid='delegate-address-field'
          placeholder={t('Delegate Ethereum Address')}
          value={delegatorAddress}
          onChange={ev => setDelegatorAddress(ev.target.value)}
          margin='normal'
          variant='standard'
          style={{ width: '40%' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Cancel')}</Button>
        <DelegateButton onDelegate={() => onDelegate(delegatorAddress)} />
      </DialogActions>
    </Dialog>
  );
};

export const ManualDelegationDialog = withStyles(styles)(ManualDelegationDialogImpl);
