/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import Tooltip from '@material-ui/core/Tooltip';
import Checkbox from '@material-ui/core/Checkbox';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import { withStyles } from '@material-ui/core/styles';
import { CopyAddressButton } from '../CopyAddressButton/CopyAddressButton';
import { useTranslation } from 'react-i18next';

const styles = () => ({
  table: {
    tableLayout: 'fixed' as any,
  },
  cell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

const ValidatorsListImpl = ({ disableAll, readOnly, onToggle, validators, classes }) => {
  const { t } = useTranslation();
  return (
    <Table className={classes.table}>
      <TableHead>
        <TableRow>
          <TableCell style={{ width: '40px' }} className={classes.cell} padding='checkbox' />
          <TableCell style={{ width: '25%' }} className={classes.cell}>
            {t('Name')}
          </TableCell>
          <TableCell style={{ width: '2%' }} className={classes.cell} />
          <TableCell style={{ width: '20%' }} className={classes.cell}>
            {t('Ethereum Address')}
          </TableCell>
          <TableCell style={{ width: '20%' }} className={classes.cell}>
            {t('Orbs Address')}
          </TableCell>
          <TableCell style={{ width: '25%' }} className={classes.cell}>
            {t('Website')}
          </TableCell>
          <TableCell style={{ width: '10%' }} className={classes.cell}>
            {t('Last election votes against (%)')}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody data-testid='validators-list'>
        {Object.keys(validators).map(address => (
          <TableRow data-testid={`validator-${address}`} key={address}>
            <TableCell className={classes.cell} padding='none'>
              {!readOnly && (
                <Checkbox
                  disabled={!validators[address].checked && disableAll}
                  data-testid={`validator-${address}-checkbox`}
                  defaultChecked={validators[address].checked}
                  onChange={() => onToggle(address)}
                />
              )}
            </TableCell>
            <TableCell
              padding='dense'
              className={classes.cell}
              component='th'
              scope='row'
              data-testid={`validator-${address}-name`}
            >
              {validators[address].name}
            </TableCell>
            <TableCell padding='none'>
              <CopyAddressButton address={address} />
            </TableCell>
            <TableCell padding='dense' className={classes.cell} data-testid={`validator-${address}-address`}>
              <Tooltip title={address} placement='top-start' enterDelay={200}>
                <span>{address}</span>
              </Tooltip>
            </TableCell>
            <TableCell padding='dense' className={classes.cell} data-testid={`validator-${address}-orbsAddress`}>
              <Tooltip title={validators[address].orbsAddress} placement='top-start' enterDelay={200}>
                <span>{validators[address].orbsAddress}</span>
              </Tooltip>
            </TableCell>
            <TableCell padding='dense' className={classes.cell}>
              <Link
                data-testid={`validator-${address}-url`}
                href={validators[address].url}
                target='_blank'
                rel='noopener noreferrer'
                color='secondary'
                variant='body1'
              >
                {validators[address].url}
              </Link>
            </TableCell>
            <TableCell padding='dense' className={classes.cell}>
              {validators[address].votesAgainst}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export const ValidatorsList = withStyles(styles)(ValidatorsListImpl);
