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
import React, { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CopyAddressButton } from '../../components/CopyAddressButton/CopyAddressButton';
import { VoteChip } from '../../components/VoteChip/VoteChip';
import { TGuardianInfoExtended } from '../../Store/GuardiansStore';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { IReactComponent } from 'mobx-react/dist/types/IReactComponent';
import { CommonTable } from '../../components/tables/CommonTable';
import { Column } from 'material-table';
import { IRewardsDistributionEvent } from 'orbs-pos-data';

const useStyles = makeStyles((theme) => ({
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

export const GuardiansList = observer<React.FunctionComponent<IProps>>((props) => {
  const { enableDelegation, onSelect, guardians, delegatedTo } = props;
  const classes = useStyles();
  const { t } = useTranslation();
  const [candidate, setCandidate] = useState(delegatedTo);

  // TODO : O.L : We use 'length' to force a re-render when the array update, find a better solution.
  const length = guardians.length;
  const sortedGuardians = useMemo(() => {
    const i = length;
    // TODO : Add a tie-breaker of 'did vote'
    return [...guardians].sort((a, b) => b.stakePercent - a.stakePercent);
  }, [guardians, length]);

  const handleGuardianCheckboxChange = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      setCandidate(ev.target.value);
      onSelect(ev.target.value);
    },
    [onSelect],
  );

  const COLUMNS = useMemo<Column<TGuardianInfoExtended>[]>(() => {
    return [
      {
        render: (guardian) =>
          enableDelegation && (
            <Checkbox
              checked={guardian.address === candidate}
              value={guardian.address}
              onChange={handleGuardianCheckboxChange}
            />
          ),
        type: 'boolean',
        sorting: false,
        cellStyle: { padding: 0 },
      },
      {
        title: t('name'),
        field: 'name',
        type: 'string',
      },
      {
        render: (guardian) => <CopyAddressButton address={guardian.address} />,
        width: 'min-content',
        type: 'boolean',
        sorting: false,
        cellStyle: { padding: 0 },
      },
      {
        title: t('address'),
        field: 'address',
      },
      {
        title: t('website'),
        field: 'website',
        render: (guardian) => (
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
        ),
      },
      {
        title: t('% in last election'),
        field: 'stakePercent',
        render: (guardian) => asPercent(guardian.stakePercent),
      },
      {
        title: t('Voted for next elections'),
        field: 'hasEligibleVote',
        render: (guardian) => <VoteChip value={guardian.hasEligibleVote} />,
      },
    ];
  }, [candidate, enableDelegation, handleGuardianCheckboxChange, t]);
  return <CommonTable columns={COLUMNS} data={sortedGuardians} options={{ padding: 'dense' }} />;
});
