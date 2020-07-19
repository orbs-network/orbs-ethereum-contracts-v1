/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useMemo } from 'react';
import Table from '@material-ui/core/Table';
import Tooltip from '@material-ui/core/Tooltip';
import TableRow from '@material-ui/core/TableRow';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import { withStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';
import { IElectedValidatorData } from '../../services/IValidatorData';
import { CopyAddressButton } from '../../components/CopyAddressButton/CopyAddressButton';

export interface IElectedValidatorDataWithAddress extends IElectedValidatorData {
  ethereumAddress: string;
}

const styles = () => ({
  table: {
    tableLayout: 'fixed' as any,
  },
  cell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

const ValidatorsListImpl = ({
  validators,
  shouldSort,
  classes,
}: {
  validators: Array<IElectedValidatorDataWithAddress>;
  shouldSort?: boolean;
  classes;
}) => {
  const { t } = useTranslation();

  const validatorsInOrder = useMemo(() => {
    const validatorsClone = [...validators];

    if (shouldSort) {
      return validatorsClone.sort((a, b) => b.stake - a.stake);
    } else {
      return validatorsClone;
    }
  }, [shouldSort, validators]);

  return (
    <Table className={classes.table}>
      <TableHead>
        <TableRow>
          <TableCell style={{ width: '20%' }} className={classes.cell}>
            {t('Name')}
          </TableCell>

          <TableCell style={{ width: '2%' }} className={classes.cell} />
          <TableCell style={{ width: '35%' }} className={classes.cell}>
            {t('Ethereum Address')}
          </TableCell>

          <TableCell style={{ width: '2%' }} className={classes.cell} />
          <TableCell style={{ width: '35%' }} className={classes.cell}>
            {t('Orbs Address')}
          </TableCell>
          <TableCell style={{ width: '10%' }}>{t('Stake')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody data-testid='validators-list'>
        {validatorsInOrder.map(electedValidatorData => {
          const keyId = electedValidatorData.orbsAddress;

          return (
            <TableRow
              data-testid={`validator-${electedValidatorData.orbsAddress}`}
              key={electedValidatorData.orbsAddress}
            >
              <TableCell className={classes.cell} component='th' scope='row' data-testid={`validator-${keyId}-name`}>
                {electedValidatorData.name}
              </TableCell>
              <TableCell padding='none'>
                <CopyAddressButton address={electedValidatorData.ethereumAddress} />
              </TableCell>
              <TableCell className={classes.cell} data-testid={`validator-${keyId}-address`}>
                <Tooltip title={keyId} placement='top-start' enterDelay={200}>
                  <span>{electedValidatorData.ethereumAddress}</span>
                </Tooltip>
              </TableCell>

              <TableCell padding='none'>
                <CopyAddressButton address={electedValidatorData.orbsAddress} />
              </TableCell>
              <TableCell className={classes.cell} data-testid={`validator-${keyId}-orbs-address`}>
                <Tooltip title={electedValidatorData.orbsAddress} placement='top-start' enterDelay={200}>
                  <span>{electedValidatorData.orbsAddress}</span>
                </Tooltip>
              </TableCell>
              <TableCell>{electedValidatorData.stake.toLocaleString()} ORBS</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export const ValidatorsList = withStyles(styles)(ValidatorsListImpl);
