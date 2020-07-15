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
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyAddressButton } from '../CopyAddressButton/CopyAddressButton';
import { VoteChip } from '../VoteChip/VoteChip';
import { TGuardianInfoExtended } from '../../Store/GuardiansStore';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { IReactComponent } from 'mobx-react/dist/types/IReactComponent';

const useStyles = makeStyles(theme => ({
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
}));

interface IProps {
  enableDelegation: boolean;
  onSelect: (guardianAddress: string) => void;
  guardians: TGuardianInfoExtended[];
  delegatedTo: string;
}

const asPercent = (num: number) =>
  (num * 100).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + '%';

export const GuardiansList = observer<React.FunctionComponent<IProps>>(props => {
  const { enableDelegation, onSelect, guardians, delegatedTo } = props;
  const classes = useStyles();
  const { t } = useTranslation();
  const [candidate, setCandidate] = useState(delegatedTo);

  // TODO : O.L : We use 'length' to force a re-render when the array update, find a better solution.
  const length = guardians.length;
  const sortedGuardians = useMemo(() => {
    const i = length;
    return [...guardians].sort((a, b) => b.stakePercent - a.stakePercent);
  }, [guardians, length]);

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
          <TableRow data-testid={`guardian-${guardian.address}`} key={guardian.address}>
            <TableCell padding='none' className={classes.cell}>
              {enableDelegation && (
                <Checkbox
                  checked={guardian.address === candidate}
                  value={guardian.address}
                  onChange={ev => {
                    setCandidate(ev.target.value);
                    onSelect(ev.target.value);
                  }}
                />
              )}
            </TableCell>
            <TableCell
              padding='none'
              className={classes.cell}
              component='th'
              scope='row'
              data-testid={`guardian-${guardian.address}-name`}
            >
              {guardian.name}
            </TableCell>
            <TableCell padding='none'>
              <CopyAddressButton address={guardian.address} />
            </TableCell>
            <TableCell size='small' className={classes.cell} data-testid={`guardian-${guardian.address}-address`}>
              {guardian.address}
            </TableCell>
            <TableCell size='small' className={classes.cell}>
              <Link
                data-testid={`guardian-${guardian.address}-url`}
                href={guardian.website}
                target='_blank'
                rel='noopener noreferrer'
                color='secondary'
                variant='body1'
              >
                {guardian.website}
              </Link>
            </TableCell>
            <TableCell size='small'>{asPercent(guardian.stakePercent)}</TableCell>
            <TableCell size='small' className={classes.cell}>
              <VoteChip value={guardian.hasEligibleVote} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});
