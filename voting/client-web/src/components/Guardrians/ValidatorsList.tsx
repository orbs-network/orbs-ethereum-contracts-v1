/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useMemo } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';
import { CommonTable } from '../tables/CommonTable';
import { Column } from 'material-table';
import { TGuardianInfoExtended } from '../../Store/GuardiansStore';
import { Checkbox, Link, Tooltip } from '@material-ui/core';
import { CopyAddressButton } from '../CopyAddressButton/CopyAddressButton';

const styles = () => ({});

const useStyles = makeStyles((theme) => ({
  table: {
    tableLayout: 'fixed' as any,
  },
  cell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

// TODO : This was constructed for quick responsive fix,  re-consider this type.
export type TValidatorForListTemp = {
  address: string;
  checked: boolean;
  name: string;
  url: string;
  orbsAddress: string;
  votesAgainst: string;
}


interface IProps {
  disableAll: boolean;
  readOnly: boolean;
  onToggle: (address: string) => void;
  validators: { [address: string]: TValidatorForListTemp };
}

export const ValidatorsList = React.memo<IProps>((props) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const { disableAll, readOnly, onToggle, validators } = props;

  const COLUMNS = useMemo<Column<TValidatorForListTemp>[]>(() => {
    return [
      {
        type: 'boolean',
        sorting: false,
        cellStyle: { padding: 0 },
        render: validator => (!readOnly && (
          <Checkbox
            disabled={!validator.checked && disableAll}
            data-testid={`validator-${validator.address}-checkbox`}
            value={validator.checked}
            onChange={() => onToggle(validator.address)}
          />
        )),
      },
      {
        title: t('name'),
        field: 'name',
      },
      {
        sorting: false,
        cellStyle: { padding: 0 },
        render: validator => <CopyAddressButton address={validator.address}/>,
      },
      {
        title: t('Ethereum Address'),
        field: 'address',
        render: validator => (
          <Tooltip title={validator.address} placement='top-start' enterDelay={200}>
            <span>{validator.address}</span>
          </Tooltip>
        ),
      },
      {
        sorting: false,
        cellStyle: { padding: 0 },
        render: validator => (<CopyAddressButton address={validator.orbsAddress}/>),
      },
      {
        title: t('Orbs Address'),
        field: 'orbsAddress',
        render: validator => (
          <Tooltip title={validator.orbsAddress} placement='top-start' enterDelay={200}>
            <span>{validator.orbsAddress}</span>
          </Tooltip>
        ),
      },
      {
        title: t('Website'),
        field: 'url',
        render: validator => (
          <Link
            data-testid={`validator-${validator.address}-url`}
            href={validator.url}
            target='_blank'
            rel='noopener noreferrer'
            color='secondary'
            variant='body1'
          >
            {validator.url}
          </Link>),
      },
      {
        title: t('Last election votes against (%)'),
        field: 'votesAgainst',
        render: validator => (`${validator.votesAgainst}%`)
      },
    ];
  }, [t]);

  return (
    <CommonTable data={Object.values(validators)} columns={COLUMNS}/>
  );
});