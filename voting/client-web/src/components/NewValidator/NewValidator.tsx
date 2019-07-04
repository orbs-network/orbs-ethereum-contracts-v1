/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { Button, FormControl, TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NewValidatorStyles } from './NewValidator.styles';
import { useApi } from '../../services/ApiContext';

const NewValidatorImpl = ({ classes }: { classes: any }) => {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [orbsAddress, setOrbsAddress] = useState('');
  const { metamask } = useApi();

  const isAddDisabled = () => [name, website, ipAddress, orbsAddress].some(attr => !attr.length);

  const addValidator = async () => {
    if (metamask) {
      const receipt = await metamask.registerValidator({
        name,
        ipAddress,
        website,
        orbsAddress,
      });
      console.log(receipt);
    }
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
