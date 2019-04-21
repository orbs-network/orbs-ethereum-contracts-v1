/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import { ApiService } from '../../api';

const styles = () => ({
  checkButton: {
    margin: '12px 30px'
  }
});

const DelegationStatusLabel = ({ address }) => {
  let label = '';
  if (address === '0x0000000000000000000000000000000000000000') {
    label = 'Your vote has not been delegated yet.';
  } else {
    label = 'Your vote has been delegated to ' + address;
  }
  return (
    <Typography variant="body1" color="secondary" style={{ marginTop: '10px' }}>
      {label}
    </Typography>
  );
};

const DelegationStatus = ({
  apiService,
  classes
}: {
  apiService: ApiService;
  classes: any;
}) => {
  const [isOpened, setIsOpened] = useState(false);
  const [address, setAddress] = useState('');
  const [delegatedTo, setDelegatedTo] = useState('');

  const fetchDelegationStatus = address => {
    apiService.getCurrentDelegation(address).then(setDelegatedTo);
  };

  const prefetch = () => {
    if (window['ethereum'] && window['ethereum']['selectedAddress']) {
      setAddress(window['ethereum']['selectedAddress']);
      fetchDelegationStatus(window['ethereum']['selectedAddress']);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => setIsOpened(true)}
      >
        Check delegation status
      </Button>

      <Dialog
        open={isOpened}
        onEnter={prefetch}
        onClose={() => setIsOpened(false)}
        maxWidth="lg"
        fullWidth={true}
      >
        <DialogTitle>Check your delegation status</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="textPrimary" gutterBottom>
            Enter your address in order to check to whom your stake is
            delegated.
          </Typography>
          <TextField
            required
            placeholder="Enter address 0x00..."
            value={address}
            onChange={ev => setAddress(ev.target.value)}
            margin="normal"
            variant="standard"
            style={{ width: '40%' }}
          />
          <Button
            variant="contained"
            color="secondary"
            className={classes.checkButton}
            onClick={() => fetchDelegationStatus(address)}
          >
            Check
          </Button>
          {delegatedTo && <DelegationStatusLabel address={delegatedTo} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOpened(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default withStyles(styles)(DelegationStatus);
