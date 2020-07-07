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
import { TableHead, Typography } from '@material-ui/core';
import Link from '@material-ui/core/Link';
import { IRewardsDistributionEvent } from 'orbs-pos-data';
import { fullOrbsFromWeiOrbs } from '../../cryptoUtils/unitConverter';

interface IProps {
  distributionsHistory: IRewardsDistributionEvent[];
}

// export const RewardsHistoryTable = ({ rewardsHistory }) => {
export const RewardsHistoryTable = React.memo<IProps>(({ distributionsHistory }) => {
  const { t } = useTranslation();

  const totalAmount = distributionsHistory.reduce((prev, cur) => {
    const fullOrbs = fullOrbsFromWeiOrbs(cur.amount);
    return prev + fullOrbs;
  }, 0);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>{t('Distribution Event')}</TableCell>
          <TableCell>{t('Transaction Hash')}</TableCell>
          <TableCell align='right'>{t('Amount')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {distributionsHistory.map((r, idx) => {
          const amount = r.amount ? fullOrbsFromWeiOrbs(r.amount) : 0;
          return (
            <TableRow key={idx}>
              <TableCell>{r.distributionEvent}</TableCell>
              <TableCell>
                <Link
                  color='secondary'
                  target='_blank'
                  rel='noopener'
                  href={`https://etherscan.io/tx/${r.transactionHash}`}
                >
                  {r.transactionHash}
                </Link>
              </TableCell>
              <TableCell align='right'>{amount.toLocaleString()} ORBS</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>{t('Total Distributed')}</TableCell>
          <TableCell />
          <TableCell align='right'>{(totalAmount || 0).toLocaleString()} ORBS</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
});
