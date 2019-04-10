/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableFooter from '@material-ui/core/TableFooter';
import { ApiService } from '../../api';

const styles = theme => ({
  form: {
    display: 'flex',
    flexDirection: 'row' as any,
    alignItems: 'baseline',
    width: '50%'
  },
  input: {
    flexGrow: 1
  },
  submit: {
    marginLeft: 30
  },
  table: {
    marginTop: `${theme.spacing.unit * 5}px`
  }
});

const RewardsPage = ({
  classes,
  apiService
}: {
  classes: any;
  apiService: ApiService;
}) => {
  const [address, setAddress] = useState('');
  const [rewards, setRewards] = useState({});

  const fetchRewards = address => {
    apiService.getRewards(address).then(setRewards);
  };

  const submitHandler = () => {
    fetchRewards(address);
  };

  return (
    <>
      <Typography variant="h2" component="h2" gutterBottom color="textPrimary">
        Total Reward
      </Typography>

      <FormControl className={classes.form} variant="standard" margin="normal">
        <TextField
          required
          className={classes.input}
          placeholder="Address"
          value={address}
          onChange={ev => setAddress(ev.target.value)}
          margin="normal"
          variant="standard"
        />
        <div className={classes.submit}>
          <Button onClick={submitHandler} variant="outlined">
            Submit
          </Button>
        </div>
      </FormControl>

      <Table className={classes.table} padding="none">
        <TableBody>
          <TableRow>
            <TableCell>Delegator Reward</TableCell>
            <TableCell>{rewards['delegatorReward']}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Guardian Excellency Reward</TableCell>
            <TableCell>{rewards['guardianReward']}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Validator Reward</TableCell>
            <TableCell>{rewards['validatorReward']}</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total Reward</TableCell>
            <TableCell>{rewards['totalReward']}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </>
  );
};

export default withStyles(styles)(RewardsPage);
