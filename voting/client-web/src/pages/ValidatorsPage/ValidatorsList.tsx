/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useMemo } from 'react';
import Table from '@material-ui/core/Table';
import Tooltip from '@material-ui/core/Tooltip';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';
import { IElectedValidatorData } from '../../services/IValidatorData';
import { CopyAddressButton } from '../../components/CopyAddressButton/CopyAddressButton';
import { Column } from 'material-table';
import { TGuardianInfoExtended } from '../../Store/GuardiansStore';
import { CommonTable } from '../../components/tables/CommonTable';

export interface IElectedValidatorDataWithAddress extends IElectedValidatorData {
  ethereumAddress: string;
}

const styles = () => ({
  table: {
    tableLayout: 'fixed' as any,
  },
  cell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

interface IProps {
  validators: Array<IElectedValidatorDataWithAddress>;
  shouldSort?: boolean;
}

const useStyles = makeStyles((theme) => ({
  table: {
    tableLayout: 'fixed' as any,
  },
  cell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

export const ValidatorsList = React.memo<IProps>((props) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { shouldSort, validators } = props;

  const validatorsInOrder = useMemo(() => {
    const validatorsClone = [...validators];

    if (shouldSort) {
      return validatorsClone.sort((a, b) => b.stake - a.stake);
    } else {
      return validatorsClone;
    }
  }, [shouldSort, validators]);

  const COLUMNS = useMemo<Column<IElectedValidatorDataWithAddress>[]>(() => {
    return [
      {
        title: t('Name'),
        field: 'name',
        width: 'fit-content',
      },
      {
        type: 'boolean',
        sorting: false,
        cellStyle: { padding: 0 },
        render: (validator) => <CopyAddressButton address={validator.ethereumAddress} />,
      },
      {
        title: t('Ethereum Address'),
        field: 'ethereumAddress',
        render: (validator) => (
          <Tooltip title={validator.ethereumAddress} placement='top-start' enterDelay={200}>
            <span>{validator.ethereumAddress}</span>
          </Tooltip>
        ),
      },
      {
        type: 'boolean',
        sorting: false,
        cellStyle: { padding: 0 },
        render: (validator) => <CopyAddressButton address={validator.orbsAddress} />,
      },
      {
        title: t('Orbs Address'),
        field: 'orbsAddress',
      },
      {
        title: t('Stake'),
        field: 'stake',
        render: (validator) => `${validator.stake.toLocaleString()} ORBS`,
      },
    ];
  }, [t]);

  return <CommonTable data={validatorsInOrder} columns={COLUMNS} />;
});
