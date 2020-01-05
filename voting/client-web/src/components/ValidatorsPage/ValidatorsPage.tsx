/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useApi } from '../../services/ApiContext';
import { ValidatorsList } from './ValidatorsList';

const styles = () => ({});

const ValidatorsPageImpl = ({ classes }: { classes: any }) => {
  const [validators, setValidators] = useState({});
  const { remoteService, metamask } = useApi();

  const getValidatorsData = async address => {
    const data = await remoteService.getElectedValidatorData(address);
    if (!validators[address]) {
      validators[address] = {};
    }

    validators[address].name = data['name'];
    validators[address].orbsAddress = data['orbsAddress'];
    validators[address].stake = data['stake'];

    setValidators(Object.assign({}, validators));
  };

  const fetchElectedValidators = async () => {
    const ids = await remoteService.getElectedValidators();
    ids.map(getValidatorsData);
  };

  useEffect(() => {
    fetchElectedValidators();
  }, []);

  const { t } = useTranslation();
  return (
    <>
      <Typography variant='h2' component='h2' gutterBottom color='textPrimary'>
        {t('Elected Validators')}
      </Typography>

      {metamask && (
        <Link to='/validator/new'>
          <Typography variant='overline' color='textSecondary'>
            {t('Become a validator')}
          </Typography>
        </Link>
      )}

      <ValidatorsList validators={validators} />
    </>
  );
};

export const ValidatorsPage = withStyles(styles)(ValidatorsPageImpl);
