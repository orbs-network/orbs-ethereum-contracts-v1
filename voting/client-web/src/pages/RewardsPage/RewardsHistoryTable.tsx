/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useMemo } from 'react';
import MaterialTable, { Column, MTableBody } from 'material-table';
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
import { TABLE_ICONS } from '../../components/tables/TableIcons';

interface IProps {
  distributionsHistory: IRewardsDistributionEvent[];
}

export const RewardsHistoryTable = React.memo<IProps>((props) => {
  const { t } = useTranslation();
  const { distributionsHistory } = props;

  const totalAmount = distributionsHistory.reduce((prev, cur) => {
    const fullOrbs = fullOrbsFromWeiOrbs(cur.amount);
    return prev + fullOrbs;
  }, 0);

  const COLUMNS = useMemo<Column<IRewardsDistributionEvent>[]>(() => {
    return [
      {
        title: t('Distribution Event'),
        field: 'distributionEvent',
        align: 'left',
        type: 'string',
        width: 'min-content',
      },
      {
        title: t('Transaction Hash'),
        field: 'transactionHash',
        render: (data, type) => {
          return (
            <Link
              color='secondary'
              target='_blank'
              rel='noopener'
              href={`https://etherscan.io/tx/${data.transactionHash}`}
            >
              {data.transactionHash}
            </Link>
          );
        },
      },
      {
        title: t('Amount'),
        align: 'right',
        width: 'min-content',
        field: 'amount',
        render: (data, type) => {
          const amount = data.amount ? fullOrbsFromWeiOrbs(data.amount) : 0;
          return `${amount.toLocaleString()} ORBS`;
        },
      },
    ];
  }, [t]);

  return (
    <MaterialTable
      components={{
        //  DEV_NOTE : Remove 'Paper'
        Container: (containerProps) => containerProps.children,
        // DEV_NOTE : Allows footer
        Body: (props) => (
          <>
            <MTableBody {...props} />
            <TableFooter style={{ width: '100%' }}>
              <TableRow>
                <TableCell>{t('Total Distributed')}</TableCell>
                <TableCell />
                <TableCell align='right'>{(totalAmount || 0).toLocaleString()} ORBS</TableCell>
              </TableRow>
            </TableFooter>
          </>
        ),
      }}
      style={{ backgroundColor: 'rgba(0,0,0, 0)' }}
      icons={TABLE_ICONS}
      columns={COLUMNS}
      data={distributionsHistory}
      options={{
        headerStyle: {
          backgroundColor: 'rgba(0,0,0,0)',
        },
        search: false,
        showTitle: false,
        paging: false,
      }}
    />
  );
});
