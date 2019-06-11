/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { Chip } from '@material-ui/core';
import red from '@material-ui/core/colors/red';
import green from '@material-ui/core/colors/green';
import { withStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';

const styles = () => ({
  yesChip: {
    width: 50,
    backgroundColor: green[400],
  },
  noChip: {
    width: 50,
    backgroundColor: red[700],
  },
});

const VoteChipImpl = ({ value, classes }) => {
  const { t } = useTranslation();
  return <Chip className={value ? classes.yesChip : classes.noChip} label={value ? t('Yes') : t('No')} />;
};

export const VoteChip = withStyles(styles)(VoteChipImpl);
