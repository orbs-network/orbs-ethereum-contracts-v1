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

export const RewardsHistoryTable = ({ rewardsHistory }) => {
  const { t } = useTranslation();

  const totalAmount = rewardsHistory.reduce((prev, cur) => prev + cur.amount, 0);
  return (
    <Table padding='none'>
      <TableHead>
        <TableRow>
          <TableCell>{t('Distribution Event')}</TableCell>
          <TableCell>{t('Transaction Hash')}</TableCell>
          <TableCell align='right'>{t('Amount')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rewardsHistory.map((r, idx) => {
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
              <TableCell align='right'>{(r.amount || 0).toLocaleString()} ORBS</TableCell>
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
};
