/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import { VoteChip } from '../VoteChip/VoteChip';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import { useTranslation } from 'react-i18next';

const formatTimestamp = timestamp =>
  new Date(timestamp).toLocaleString('en-gb', {
    hour12: false,
    timeZone: 'UTC',
    timeZoneName: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

export const DelegationInfoTable = ({ delegatorInfo, guardianInfo }) => {
  const { t } = useTranslation();
  return (
    <Table padding='none'>
      <TableBody>
        <TableRow>
          <TableCell>{t('Delegated To')}</TableCell>
          <TableCell align='right'>{delegatorInfo['delegatedTo']}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t(`Delegator's ORBS Balance`)}</TableCell>
          <TableCell align='right'>{delegatorInfo['delegatorBalance']} ORBS</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Guardian voted in previous elections')}</TableCell>
          <TableCell align='right'>{guardianInfo['voted'] && <VoteChip value={guardianInfo['voted']} />}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Guardian voted for next elections')}</TableCell>
          <TableCell align='right'>
            {guardianInfo['hasEligibleVote'] && <VoteChip value={guardianInfo['hasEligibleVote']} />}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Delegation method')}</TableCell>
          <TableCell align='right'>{delegatorInfo['delegationType']}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Delegation block number')}</TableCell>
          <TableCell align='right'>{delegatorInfo['delegationBlockNumber'].toLocaleString()}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Delegation timestamp')}</TableCell>
          <TableCell align='right'>
            {delegatorInfo['delegationTimestamp'] && formatTimestamp(delegatorInfo['delegationTimestamp'])}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
