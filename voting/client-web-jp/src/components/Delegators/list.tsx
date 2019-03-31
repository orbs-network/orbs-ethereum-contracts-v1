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

const styles = () => ({
  table: {
    marginBottom: 30
  }
});

const GuardiansList = ({ onSelect, guardians, classes }) => {
  return (
    <Table className={classes.table}>
      <TableHead>
        <TableRow>
          <TableCell>名前</TableCell>
          <TableCell>アドレス</TableCell>
          <TableCell>ウェブサイト</TableCell>
          <TableCell>前回投票時のステーク</TableCell>
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
              component="th"
              scope="row"
              data-testid={`guardian-${address}-name`}
            >
              {guardians[address].name}
            </TableCell>
            <TableCell data-testid={`guardian-${address}-address`}>
              {address}
            </TableCell>
            <TableCell>
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
            <TableCell>{guardians[address].stake}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default withStyles(styles)(GuardiansList);
