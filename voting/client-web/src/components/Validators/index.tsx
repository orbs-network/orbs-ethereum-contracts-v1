/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import ValidatorsList from './list';
import { Mode } from '../../api/interface';
import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom';

const styles = () => ({});

const ValidatorsPage = ({ classes, apiService }) => {
  const [validators, setValidators] = useState({});

  const fetchElectedValidators = async () => {
    const ids = await apiService.getElectedValidators();
    const list = await Promise.all(
      ids.map(address => apiService.getElectedValidatorData(address))
    );
    const validators = ids.reduce((acc, currId, idx) => {
      acc[currId] = {
        name: list[idx]['name'],
        address: currId,
        orbsAddress: list[idx]['orbsAddress'],
        stake: list[idx]['stake'],
        totalReward: list[idx]['totalReward'],
        participationReward: list[idx]['participationReward']
      };
      return acc;
    }, {});
    setValidators(validators);
  };

  const hasMetamask = () => apiService.mode === Mode.ReadWrite;

  useEffect(() => {
    fetchElectedValidators();
  }, []);

  return (
    <>
      <Typography variant="h2" component="h2" gutterBottom color="textPrimary">
        Elected Validators
      </Typography>

      {hasMetamask() && (
        <Link to="/validator/new">
          <Typography variant="overline" color="textSecondary">
            Become a validator
          </Typography>
        </Link>
      )}

      <ValidatorsList validators={validators} />
    </>
  );
};

export default withStyles(styles)(ValidatorsPage);
