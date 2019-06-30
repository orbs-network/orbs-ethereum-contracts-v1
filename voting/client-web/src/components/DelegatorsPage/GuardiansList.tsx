/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { Checkbox } from '@material-ui/core';
import blue from '@material-ui/core/colors/blue';
import Link from '@material-ui/core/Link';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyAddressButton } from '../CopyAddressButton/CopyAddressButton';
import { VoteChip } from '../VoteChip/VoteChip';

const styles = () => ({
  table: {
    marginBottom: 30,
    tableLayout: 'fixed' as any,
  },
  cell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  delegateButton: {
    width: 70,
    backgroundColor: blue[700],
  },
});

const asPercent = (num: number) => (
  console.log(num), (num * 100).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + '%'
);

const GuardiansListImpl = ({ enableDelegation, onSelect, guardians, classes, delegatedTo }) => {
  const { t } = useTranslation();
  const [candidate, setCandidate] = useState(delegatedTo);
  const sortedGuardians = Object.values(guardians as object);
  sortedGuardians.sort((a, b) => b.stake - a.stake);
  return (
    <Table className={classes.table}>
      <TableHead>
        <TableRow>
          <TableCell style={{ width: '65px' }} className={classes.cell} padding='checkbox' />
          <TableCell style={{ width: '30%' }} className={classes.cell}>
            {t('Name')}
          </TableCell>
          <TableCell style={{ width: '4%' }} />
          <TableCell style={{ width: '20%' }} className={classes.cell}>
            {t('Address')}
          </TableCell>
          <TableCell style={{ width: '25%' }} className={classes.cell}>
            {t('Website')}
          </TableCell>
          <TableCell style={{ width: '10%' }} className={classes.cell}>
            {t('% in last election')}
          </TableCell>
          <TableCell style={{ width: '13%' }} className={classes.cell}>
            {t('Voted for next elections')}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody data-testid='guardians-list'>
        {sortedGuardians.map(guardian => (
          <TableRow data-testid={`guardian-${guardian['address']}`} key={guardian['address']}>
            <TableCell padding='none' className={classes.cell}>
              {enableDelegation && (
                <Checkbox
                  checked={guardian['address'] === candidate}
                  value={guardian['address']}
                  onChange={ev => {
                    setCandidate(ev.target.value), onSelect(ev.target.value);
                  }}
                />
              )}
            </TableCell>
            <TableCell
              padding='none'
              className={classes.cell}
              component='th'
              scope='row'
              data-testid={`guardian-${guardian['address']}-name`}
            >
              {guardian['name']}
            </TableCell>
            <TableCell padding='none'>
              <CopyAddressButton address={guardian['address']} />
            </TableCell>
            <TableCell padding='dense' className={classes.cell} data-testid={`guardian-${guardian['address']}-address`}>
              {guardian['address']}
            </TableCell>
            <TableCell padding='dense' className={classes.cell}>
              <Link
                data-testid={`guardian-${guardian['address']}-url`}
                href={guardian['url']}
                target='_blank'
                rel='noopener noreferrer'
                color='secondary'
                variant='body1'
              >
                {guardian['url']}
              </Link>
            </TableCell>
            <TableCell padding='dense'>{asPercent(guardian['stake'])}</TableCell>
            <TableCell padding='dense' className={classes.cell}>
              <VoteChip value={guardian['hasEligibleVote']} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const GuardiansList = withStyles(styles)(GuardiansListImpl);
