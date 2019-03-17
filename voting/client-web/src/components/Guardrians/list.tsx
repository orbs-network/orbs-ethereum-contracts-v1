import React from 'react';
import Link from '@material-ui/core/Link';
import Table from '@material-ui/core/Table';
import Checkbox from '@material-ui/core/Checkbox';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({});

const ValidatorsList = ({ readOnly, onToggle, validators, classes }) => {
  return (
    <Table className={classes.table}>
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox" />
          <TableCell>Name</TableCell>
          <TableCell>Address</TableCell>
          <TableCell>Website</TableCell>
          <TableCell>Last election votes against (%)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody data-testid="validators-list">
        {Object.keys(validators).map(address => (
          <TableRow data-testid={`validator-${address}`} key={address}>
            <TableCell padding="checkbox">
              {!readOnly && (
                <Checkbox
                  data-testid={`validator-${address}-checkbox`}
                  defaultChecked={validators[address].checked}
                  onChange={() => onToggle(address)}
                />
              )}
            </TableCell>
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
            <TableCell>
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
            <TableCell>0</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default withStyles(styles)(ValidatorsList);
