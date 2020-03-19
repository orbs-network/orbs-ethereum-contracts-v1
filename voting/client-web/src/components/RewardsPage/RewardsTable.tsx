/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableFooter from '@material-ui/core/TableFooter';
import { useTranslation } from 'react-i18next';

export const RewardsTable = ({ rewards }) => {
  const { t } = useTranslation();
  const { delegatorReward = 0, guardianReward = 0, validatorReward = 0 } = rewards;
  const totalReward = delegatorReward + guardianReward + validatorReward;
  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>{t('Delegator Reward')}</TableCell>
          <TableCell align='right'>{delegatorReward.toLocaleString()} ORBS</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Guardian Excellency Reward')}</TableCell>
          <TableCell align='right'>{guardianReward.toLocaleString()} ORBS</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Validator Reward')}</TableCell>
          <TableCell align='right'>{validatorReward.toLocaleString()} ORBS</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>{t('Total Reward')}</TableCell>
          <TableCell align='right'>{totalReward.toLocaleString()} ORBS</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
};
