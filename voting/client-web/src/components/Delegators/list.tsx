/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useState } from 'react';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import { withStyles } from '@material-ui/core/styles';
import { Chip, Checkbox } from '@material-ui/core';
import green from '@material-ui/core/colors/green';
import red from '@material-ui/core/colors/red';
import blue from '@material-ui/core/colors/blue';
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
  delegateButton: {
    width: 70,
    backgroundColor: blue[700]
  },
  noChip: {
    width: 50,
    backgroundColor: red[700]
  }
});

const GuardiansList = ({
  enableDelegation,
  onSelect,
  guardians,
  classes,
  delegatedTo
}) => {
  const [candidate, setCandidate] = useState('');
  const sortedGuardians = Object.values(guardians);
  sortedGuardians.sort((a, b) =>
    a['name'].toLowerCase() > b['name'].toLowerCase() ? 1 : -1
  );
  return (
    <Table className={classes.table}>
      <TableHead>
        <TableRow>
          <TableCell style={{ width: '10px' }} className={classes.cell} />
          <TableCell style={{ width: '30%' }} className={classes.cell}>
            Name
          </TableCell>
          <TableCell style={{ width: '4%' }} />
          <TableCell style={{ width: '20%' }} className={classes.cell}>
            Address
          </TableCell>
          <TableCell style={{ width: '25%' }} className={classes.cell}>
            Website
          </TableCell>
          <TableCell style={{ width: '10%' }} className={classes.cell}>
            % in last election
          </TableCell>
          <TableCell style={{ width: '13%' }} className={classes.cell}>
            Valid for next elections
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody data-testid="guardians-list">
        {sortedGuardians.map(guardian => (
          <TableRow
            data-testid={`guardian-${guardian['address']}`}
            key={guardian['address']}
          >
            <TableCell padding="none" className={classes.cell}>
              {enableDelegation && (
                <Checkbox
                  checked={
                    guardian['address'] === delegatedTo ||
                    guardian['address'] === candidate
                  }
                  value={guardian['address']}
                  onChange={ev => {
                    setCandidate(ev.target.value), onSelect(ev.target.value);
                  }}
                />
              )}
            </TableCell>
            <TableCell
              padding="none"
              className={classes.cell}
              component="th"
              scope="row"
              data-testid={`guardian-${guardian['address']}-name`}
            >
              {guardian['name']}
            </TableCell>
            <TableCell padding="none">
              <CopyAddressButton address={guardian['address']} />
            </TableCell>
            <TableCell
              padding="dense"
              className={classes.cell}
              data-testid={`guardian-${guardian['address']}-address`}
            >
              {guardian['address']}
            </TableCell>
            <TableCell padding="dense" className={classes.cell}>
              <Link
                data-testid={`guardian-${guardian['address']}-url`}
                href={guardian['url']}
                target="_blank"
                rel="noopener noreferrer"
                color="secondary"
                variant="body1"
              >
                {guardian['url']}
              </Link>
            </TableCell>
            <TableCell padding="dense">{guardian['stake']}%</TableCell>
            <TableCell padding="dense" className={classes.cell}>
              <Chip
                className={
                  guardian['hasEligibleVote'] ? classes.yesChip : classes.noChip
                }
                label={guardian['hasEligibleVote'] ? 'Yes' : 'No'}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default withStyles(styles)(GuardiansList);
