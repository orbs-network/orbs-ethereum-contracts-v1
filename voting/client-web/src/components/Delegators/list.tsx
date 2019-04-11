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
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import { withStyles } from '@material-ui/core/styles';
import { Chip } from '@material-ui/core';
import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';
import { CopyAddressButton } from '../CopyAddressButton';

const styles = () => ({
  table: {
    marginBottom: 30,
    tableLayout: 'fixed' as any
  },
  cell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  yesChip: {
    width: 50,
    backgroundColor: green[700]
  },
  noChip: {
    width: 50,
    backgroundColor: red[700]
  }
});

const GuardiansList = ({ onSelect, guardians, classes }) => {
  return (
    <Table className={classes.table}>
      <TableHead>
        <TableRow>
          <TableCell style={{ width: '18%' }} className={classes.cell}>
            Name
          </TableCell>
          <TableCell style={{ width: '4%' }} />
          <TableCell style={{ width: '35%' }} className={classes.cell}>
            Address
          </TableCell>
          <TableCell style={{ width: '25%' }} className={classes.cell}>
            Website
          </TableCell>
          <TableCell style={{ width: '10%' }} className={classes.cell}>
            Stake in last election
          </TableCell>
          <TableCell style={{ width: '10%' }} className={classes.cell}>
            Vote valid for next elections
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody data-testid="guardians-list">
        {Object.keys(guardians).map(address => (
          <TableRow
            data-testid={`guardian-${address}`}
            key={address}
            hover={true}
            onClick={() => onSelect(address)}
          >
            <TableCell
              className={classes.cell}
              component="th"
              scope="row"
              data-testid={`guardian-${address}-name`}
            >
              {guardians[address].name}
            </TableCell>
            <TableCell>
              <CopyAddressButton address={address} />
            </TableCell>
            <TableCell
              className={classes.cell}
              data-testid={`guardian-${address}-address`}
            >
              {address}
            </TableCell>
            <TableCell className={classes.cell}>
              <Link
                data-testid={`guardian-${address}-url`}
                href={guardians[address].url}
                target="_blank"
                rel="noopener noreferrer"
                color="secondary"
                variant="body1"
              >
                {guardians[address].url}
              </Link>
            </TableCell>
            <TableCell>{guardians[address].stake}%</TableCell>
            <TableCell className={classes.cell}>
              <Chip
                className={
                  guardians[address].hasEligibleVote
                    ? classes.yesChip
                    : classes.noChip
                }
                label={guardians[address].hasEligibleVote ? 'Yes' : 'No'}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default withStyles(styles)(GuardiansList);
