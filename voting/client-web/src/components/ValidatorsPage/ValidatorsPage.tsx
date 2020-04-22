/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useApi } from '../../services/ApiContext';
import { ValidatorsList } from './ValidatorsList';
import { IElectedValidatorData } from '../../services/IValidatorData';

const styles = () => ({});

const ValidatorsPageImpl = ({ classes }: { classes: any }) => {
  const [selectedValidatorsDataList, setSelectedValidatorsDataList] = useState<Array<IElectedValidatorData>>([]);
  const { remoteService, metamask } = useApi();

  const readValidatorsData = useCallback(
    async (addresses: Array<string>) => {
      const promises = addresses.map(address => remoteService.getElectedValidatorData(address));

      const electedValidatorData = await Promise.all(promises);

      return electedValidatorData;
    },
    [remoteService],
  );

  const fetchElectedValidators = useCallback(async () => {
    const addresses = await remoteService.getElectedValidators();
    const validatorsData = await readValidatorsData(addresses);

    setSelectedValidatorsDataList(validatorsData);
  }, [remoteService, readValidatorsData]);

  // Runs once on component load
  useEffect(() => {
    fetchElectedValidators();
  }, [fetchElectedValidators]);

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

      <ValidatorsList validators={selectedValidatorsDataList} shouldSort />
    </>
  );
};

export const ValidatorsPage = withStyles(styles)(ValidatorsPageImpl);
