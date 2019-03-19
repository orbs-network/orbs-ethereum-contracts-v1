import React from 'react';
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
          <TableCell>Ethereum Address</TableCell>
          <TableCell>Orbs Address</TableCell>
          <TableCell>Stake</TableCell>
          <TableCell>Total Reward</TableCell>
          <TableCell>Participation Reward</TableCell>
        </TableRow>
      </TableHead>
      <TableBody data-testid="validators-list">
        {Object.keys(validators).map(id => (
          <TableRow data-testid={`validator-${id}`} key={id}>
            <TableCell
              component="th"
              scope="row"
              data-testid={`validator-${id}-name`}
            >
              {validators[id].name}
            </TableCell>
            <TableCell data-testid={`validator-${id}-address`}>{id}</TableCell>
            <TableCell data-testid={`validator-${id}-orbs-address`}>
              {validators[id].orbsAddress}
            </TableCell>
            <TableCell>{validators[id].stake} orbs</TableCell>
            <TableCell>{validators[id].totalReward} orbs</TableCell>
            <TableCell>{validators[id].participationReward} orbs</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default withStyles(styles)(ValidatorsList);
