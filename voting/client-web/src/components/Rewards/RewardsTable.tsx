/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableFooter from '@material-ui/core/TableFooter';

export const RewardsTable = ({ rewards }) => {
  return (
    <Table padding="none">
      <TableBody>
        <TableRow>
          <TableCell>Delegator Reward</TableCell>
          <TableCell align="right">{rewards['delegatorReward']}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Guardian Excellency Reward</TableCell>
          <TableCell align="right">{rewards['guardianReward']}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Validator Reward</TableCell>
          <TableCell align="right">{rewards['validatorReward']}</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total Reward</TableCell>
          <TableCell align="right">{rewards['totalReward']}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
};
