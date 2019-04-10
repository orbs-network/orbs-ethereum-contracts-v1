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
import Checkbox from '@material-ui/core/Checkbox';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import { withStyles } from '@material-ui/core/styles';
import { Tooltip, SvgIcon, IconButton } from '@material-ui/core';

const styles = () => ({
  table: {
    tableLayout: 'fixed' as any
  },
  cell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
});

const CopyIcon = () => {
  return (
    <SvgIcon fontSize="small">
      <path fill="none" d="M0 0h24v24H0V0z" />
      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm-1 4H8c-1.1 0-1.99.9-1.99 2L6 21c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V11l-6-6zM8 21V7h6v5h5v9H8z" />
    </SvgIcon>
  );
};

const CopyAddress = ({ address }) => {
  const [tooltipShown, setTooltopShown] = useState(false);
  const copy = () => {
    (navigator as any).clipboard.writeText(address).then(() => {
      setTooltopShown(true);
      setTimeout(() => {
        setTooltopShown(false);
      }, 1000);
    });
  };
  return (
    <Tooltip placement="top" title="Copied!" open={tooltipShown}>
      <IconButton onClick={copy}>
        <CopyIcon />
      </IconButton>
    </Tooltip>
  );
};

const ValidatorsList = ({
  disableAll,
  readOnly,
  onToggle,
  validators,
  classes
}) => {
  return (
    <Table className={classes.table}>
      <TableHead>
        <TableRow>
          <TableCell
            style={{ width: '5%' }}
            className={classes.cell}
            padding="checkbox"
          />
          <TableCell style={{ width: '20%' }} className={classes.cell}>
            Name
          </TableCell>
          <TableCell style={{ width: '4%' }} className={classes.cell} />
          <TableCell style={{ width: '25%' }} className={classes.cell}>
            Ethereum Address
          </TableCell>
          <TableCell style={{ width: '25%' }} className={classes.cell}>
            Orbs Address
          </TableCell>
          <TableCell style={{ width: '20%' }} className={classes.cell}>
            Website
          </TableCell>
          <TableCell style={{ width: '10%' }} className={classes.cell}>
            Last election votes against (%)
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody data-testid="validators-list">
        {Object.keys(validators).map(address => (
          <TableRow data-testid={`validator-${address}`} key={address}>
            <TableCell className={classes.cell} padding="checkbox">
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
              className={classes.cell}
              component="th"
              scope="row"
              data-testid={`validator-${address}-name`}
            >
              {validators[address].name}
            </TableCell>
            <TableCell>
              {!!(navigator as any).clipboard && (
                <CopyAddress address={address} />
              )}
            </TableCell>
            <TableCell
              className={classes.cell}
              data-testid={`validator-${address}-address`}
            >
              <Tooltip title={address} placement="top-start" enterDelay={200}>
                <span>{address}</span>
              </Tooltip>
            </TableCell>
            <TableCell
              className={classes.cell}
              data-testid={`validator-${address}-orbsAddress`}
            >
              <Tooltip
                title={validators[address].orbsAddress}
                placement="top-start"
                enterDelay={200}
              >
                <span>{validators[address].orbsAddress}</span>
              </Tooltip>
            </TableCell>
            <TableCell className={classes.cell}>
              <Link
                data-testid={`validator-${address}-url`}
                href={validators[address].url}
                target="_blank"
                rel="noopener noreferrer"
                color="secondary"
                variant="body1"
              >
                {validators[address].url}
              </Link>
            </TableCell>
            <TableCell className={classes.cell}>
              {validators[address].votesAgainst}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default withStyles(styles)(ValidatorsList);
