/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import Table from '@material-ui/core/Table';
import Tooltip from '@material-ui/core/Tooltip';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import { withStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';

const styles = () => ({
  table: {
    tableLayout: 'fixed' as any
  },
  cell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
});

const ValidatorsList = ({ validators, classes }) => {
  const { t } = useTranslation();
  return (
    <Table className={classes.table}>
      <TableHead>
        <TableRow>
          <TableCell style={{ width: '20%' }} className={classes.cell}>
            {t('Name')}
          </TableCell>
          <TableCell style={{ width: '35%' }} className={classes.cell}>
            {t('Ethereum Address')}
          </TableCell>
          <TableCell style={{ width: '35%' }} className={classes.cell}>
            {t('Orbs Address')}
          </TableCell>
          <TableCell style={{ width: '10%' }}>{t('Stake')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody data-testid="validators-list">
        {Object.keys(validators).map(id => (
          <TableRow data-testid={`validator-${id}`} key={id}>
            <TableCell
              className={classes.cell}
              component="th"
              scope="row"
              data-testid={`validator-${id}-name`}
            >
              {validators[id].name}
            </TableCell>
            <TableCell
              className={classes.cell}
              data-testid={`validator-${id}-address`}
            >
              <Tooltip title={id} placement="top-start" enterDelay={200}>
                <span>{id}</span>
              </Tooltip>
            </TableCell>
            <TableCell
              className={classes.cell}
              data-testid={`validator-${id}-orbs-address`}
            >
              <Tooltip
                title={validators[id].orbsAddress}
                placement="top-start"
                enterDelay={200}
              >
                <span>{validators[id].orbsAddress}</span>
              </Tooltip>
            </TableCell>
            <TableCell>{validators[id].stake} orbs</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default withStyles(styles)(ValidatorsList);
