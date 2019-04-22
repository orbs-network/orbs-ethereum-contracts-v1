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
import { ApiService } from '../../api';

const styles = () => ({});

const ValidatorsPage = ({
  classes,
  apiService
}: {
  classes: any;
  apiService: ApiService;
}) => {
  const [validators, setValidators] = useState({});

  const getValidatorsData = async address => {
    const data = await apiService.getElectedValidatorData(address);
    if (!validators[address]) {
      validators[address] = {};
    }

    validators[address].name = data['name'];
    validators[address].address;
    validators[address].orbsAddress = data['orbsAddress'];
    validators[address].stake = data['stake'];

    setValidators(Object.assign({}, validators));
  };

  const fetchElectedValidators = async () => {
    const ids = await apiService.getElectedValidators();
    ids.map(getValidatorsData);
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
