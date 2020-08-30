/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useMemo } from 'react';
import { VoteChip } from '../../components/VoteChip/VoteChip';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import Typography from '@material-ui/core/Typography';
import { useTranslation } from 'react-i18next';
import { TStakingInfo } from './rewardsPageHooks';
import { TCurrentDelegationInfo } from '../../services/IRemoteService';
import { TableContainer, useMediaQuery } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';

const formatTimestamp = (timestamp) =>
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
  // Props of delegator
  delegatorAddress: string;
  delegatorInfo: TCurrentDelegationInfo;
  delegatorStakingInfo: TStakingInfo;
  isAGuardian?: boolean;

  // Props of Delegatee (Guardian)
  guardianInfo: any;
}

export const DelegationInfoTable = React.memo<IProps>((props) => {
  const { delegatorAddress, delegatorInfo, delegatorStakingInfo, guardianInfo, isAGuardian } = props;

  const { t } = useTranslation();

  // DEV_NOTE : This huge memo could be broken
  const { delegationType, delegatorBalance, delegatedTo, delegationBlockNumber, delegationTimestamp } = useMemo<{
    delegationType: string;
    delegatorBalance: string;
    delegatedTo: string;
    delegationBlockNumber: string;
    delegationTimestamp: string;
  }>(() => {
    const delegatorBalance = `${(delegatorInfo.delegatorBalance || 0).toLocaleString()} ORBS`;
    let delegatedTo: string;
    let delegationBlockNumber: string;
    let delegationTimestamp: string;

    let delegationType = delegatorInfo.delegationType;

    if (delegationType === 'Not-Delegated') {
      // delegatorBalance = '-';
      delegatedTo = '-';
      delegationBlockNumber = '-';
      delegationTimestamp = '-';
    } else {
      // delegatorBalance = `${(delegatorInfo.delegatorBalance || 0).toLocaleString()} ORBS`;
      delegatedTo = delegatorInfo.delegatedTo;
      delegationBlockNumber = (delegatorInfo.delegationBlockNumber || 0).toLocaleString();
      delegationTimestamp = formatTimestamp(delegatorInfo['delegationTimestamp']);
    }

    // DEV_NOTE : Guardians always 'delegate' to themself
    if (isAGuardian) {
      delegatedTo = delegatorAddress;
      delegationBlockNumber = '-';
      delegationTimestamp = '-';
      delegationType = 'Self (Guardian)';
    }

    return {
      delegationType,
      delegatorBalance,
      delegatedTo,
      delegationBlockNumber,
      delegationTimestamp,
    };
  }, [delegatorAddress, delegatorInfo, isAGuardian]);

  // DEV_NOTE : This is a hack to mamk the "table" looks better with all of
  //            the content visible in mobile (without the need to scroll for) because of the
  //            long address.
  const theme = useTheme();
  const smallerThanSmall = useMediaQuery(theme.breakpoints.down('xs'));
  const contentCellAlignment = smallerThanSmall ? 'left' : 'right';

  return (
    <TableContainer>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>{t('Delegated To')}</TableCell>
            <TableCell align='right'>
              <Typography
                noWrap
                style={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {delegatedTo}
              </Typography>
            </TableCell>
            {/*<TableCell align='right'></TableCell>*/}
          </TableRow>
          <TableRow>
            <TableCell>{t(`delegatorNonStakedOrbs`)}</TableCell>
            <TableCell align={contentCellAlignment}>{delegatorBalance}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t(`delegatorStakedOrbs`)}</TableCell>
            <TableCell align={contentCellAlignment}>{delegatorStakingInfo.stakedOrbs?.toLocaleString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Guardian voted in previous elections')}</TableCell>
            <TableCell align={contentCellAlignment}>
              {guardianInfo.voted === true || guardianInfo.voted === false ? (
                <VoteChip value={guardianInfo.voted} />
              ) : (
                '-'
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Guardian voted for next elections')}</TableCell>
            <TableCell align={contentCellAlignment}>
              {guardianInfo.hasEligibleVote === true || guardianInfo.hasEligibleVote === false ? (
                <VoteChip value={guardianInfo.hasEligibleVote} />
              ) : (
                '-'
              )}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Delegation method')}</TableCell>
            <TableCell align={contentCellAlignment}>{delegationType}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Delegation block number')}</TableCell>
            <TableCell align={contentCellAlignment}>{delegationBlockNumber}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('Delegation timestamp')}</TableCell>
            <TableCell align={contentCellAlignment}>{delegationTimestamp}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
});
