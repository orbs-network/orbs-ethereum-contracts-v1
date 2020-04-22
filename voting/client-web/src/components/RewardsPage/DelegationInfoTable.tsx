/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useMemo } from 'react';
import { VoteChip } from '../VoteChip/VoteChip';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'react-hanger';

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

// TODO : FUTRUE : O.L : Fix types
interface IProps {
  delegatorInfo: any;
  guardianInfo: any;
  delegatorStakingInfo: { stakedOrbs: number };
}

export const DelegationInfoTable = React.memo<IProps>(props => {
  const { delegatorInfo, delegatorStakingInfo, guardianInfo } = props;

  const { t } = useTranslation();

  // DEV_NOTE : This huge memo could be broken
  const { delegationType, delegatorBalance, delegatedTo, delegationBlockNumber, delegationTimestamp } = useMemo<{
    delegationType: string;
    delegatorBalance: string;
    delegatedTo: string;
    delegationBlockNumber: string;
    delegationTimestamp: string;
  }>(() => {
    let delegatorBalance: string;
    let delegatedTo: string;
    let delegationBlockNumber: string;
    let delegationTimestamp: string;

    const delegationType = delegatorInfo.delegationType;

    if (delegationType === 'Not-Delegated') {
      delegatorBalance = '-';
      delegatedTo = '-';
      delegationBlockNumber = '-';
      delegationTimestamp = '-';
    } else {
      delegatorBalance = `${(delegatorInfo.delegatorBalance || 0).toLocaleString()} ORBS`;
      delegatedTo = delegatorInfo.delegatedTo;
      delegationBlockNumber = (delegatorInfo.delegationBlockNumber || 0).toLocaleString();
      delegationTimestamp = formatTimestamp(delegatorInfo['delegationTimestamp']);
    }

    return {
      delegationType,
      delegatorBalance,
      delegatedTo,
      delegationBlockNumber,
      delegationTimestamp,
    };
  }, [delegatorInfo]);

  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>{t('Delegated To')}</TableCell>
          <TableCell align='right'>{delegatedTo}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t(`delegatorNonStakedOrbs`)}</TableCell>
          <TableCell align='right'>{delegatorBalance}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t(`delegatorStakedOrbs`)}</TableCell>
          <TableCell align='right'>{delegatorStakingInfo.stakedOrbs}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Guardian voted in previous elections')}</TableCell>
          <TableCell align='right'>
            {guardianInfo['voted'] === true || guardianInfo['voted'] === false ? (
              <VoteChip value={guardianInfo['voted']} />
            ) : (
              '-'
            )}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Guardian voted for next elections')}</TableCell>
          <TableCell align='right'>
            {guardianInfo['hasEligibleVote'] === true || guardianInfo['hasEligibleVote'] === false ? (
              <VoteChip value={guardianInfo['hasEligibleVote']} />
            ) : (
              '-'
            )}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Delegation method')}</TableCell>
          <TableCell align='right'>{delegationType}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Delegation block number')}</TableCell>
          <TableCell align='right'>{delegationBlockNumber}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>{t('Delegation timestamp')}</TableCell>
          <TableCell align='right'>{delegationTimestamp}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
});
