import React from 'react';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({});

const ValidatorsList = ({ validators, classes }) => {
  return (
    <Table className={classes.table}>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Address</TableCell>
          <TableCell>Stake</TableCell>
          <TableCell>Total Reward</TableCell>
          <TableCell>Participation Reward</TableCell>
        </TableRow>
      </TableHead>
      <TableBody data-testid="validators-list">
        {Object.keys(validators).map(address => (
          <TableRow data-testid={`validator-${address}`} key={address}>
            <TableCell
              component="th"
              scope="row"
              data-testid={`validator-${address}-name`}
            >
              {validators[address].name}
            </TableCell>
            <TableCell data-testid={`validator-${address}-address`}>
              {address}
            </TableCell>
            <TableCell>0</TableCell>
            <TableCell>0</TableCell>
            <TableCell>0</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default withStyles(styles)(ValidatorsList);
