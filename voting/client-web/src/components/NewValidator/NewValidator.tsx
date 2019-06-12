/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { NewValidatorStyles } from './NewValidator.styles';
import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { FormControl, TextField, Button } from '@material-ui/core';
import { ApiService } from '../../api/ApiService';
import { useTranslation } from 'react-i18next';

const NewValidatorImpl = ({ classes, apiService }: { classes: any; apiService: ApiService }) => {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [orbsAddress, setOrbsAddress] = useState('');

  const isAddDisabled = () => [name, website, ipAddress, orbsAddress].some(attr => !attr.length);

  const addValidator = async () => {
    const receipt = await apiService.registerValidator({
      name,
      ipAddress,
      website,
      orbsAddress,
    });
    console.log(receipt);
  };

  const { t } = useTranslation();
  return (
    <>
      <FormControl className={classes.form} variant='standard' margin='normal'>
        <TextField
          required
          placeholder={t('Your name')}
          value={name}
          onChange={ev => setName(ev.target.value)}
          margin='normal'
          variant='standard'
        />
        <TextField
          required
          placeholder={t('Your website')}
          value={website}
          onChange={ev => setWebsite(ev.target.value)}
          margin='normal'
          variant='standard'
        />
        <TextField
          required
          placeholder={t('Your IP Address')}
          value={ipAddress}
          onChange={ev => setIpAddress(ev.target.value)}
          margin='normal'
          variant='standard'
        />
        <TextField
          required
          placeholder={t('Your Orbs Address')}
          value={orbsAddress}
          onChange={ev => setOrbsAddress(ev.target.value)}
          margin='normal'
          variant='standard'
        />
        <Button
          className={classes.add}
          variant='outlined'
          color='secondary'
          onClick={addValidator}
          disabled={isAddDisabled()}
        >
          {t('Add')}
        </Button>
      </FormControl>
    </>
  );
};

export const NewValidator = withStyles(NewValidatorStyles)(NewValidatorImpl);
