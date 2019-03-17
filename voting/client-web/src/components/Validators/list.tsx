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
        {validators.map(validator => (
          <TableRow
            data-testid={`validator-${validator.address}`}
            key={validator.address}
          >
            <TableCell
              component="th"
              scope="row"
              data-testid={`validator-${validator.address}-name`}
            >
              {validator.name}
            </TableCell>
            <TableCell data-testid={`validator-${validator.address}-address`}>
              {validator.address}
            </TableCell>
            <TableCell>{validator.stake}</TableCell>
            <TableCell>{validator.totalReward}</TableCell>
            <TableCell>{validator.participationReward}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default withStyles(styles)(ValidatorsList);
