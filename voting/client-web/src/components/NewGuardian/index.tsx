/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import styles from './styles';
import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { FormControl, TextField, Button } from '@material-ui/core';
import { ApiService } from '../../api';

const NewGuardian = ({
  classes,
  apiService
}: {
  classes: any;
  apiService: ApiService;
}) => {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');

  const isAddDisabled = () => !(name.length > 0 && website.length > 0);

  const addGuardian = async () => {
    const receipt = await apiService.registerGuardian({ name, website });
    console.log(receipt);
  };

  return (
    <>
      <FormControl className={classes.form} variant="standard" margin="normal">
        <TextField
          required
          data-testid="name"
          placeholder="Your name"
          value={name}
          onChange={ev => setName(ev.target.value)}
          margin="normal"
          variant="standard"
        />
        <TextField
          required
          data-testid="website"
          placeholder="Your website"
          value={website}
          onChange={ev => setWebsite(ev.target.value)}
          margin="normal"
          variant="standard"
        />
        <Button
          data-testid="submit"
          className={classes.add}
          variant="outlined"
          color="secondary"
          onClick={addGuardian}
          disabled={isAddDisabled()}
        >
          Add
        </Button>
      </FormControl>
    </>
  );
};

export default withStyles(styles)(NewGuardian);
