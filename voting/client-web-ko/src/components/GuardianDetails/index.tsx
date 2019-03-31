/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import { withStyles } from '@material-ui/core/styles';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';

const styles = () => ({});

const DelegateButton = ({ onDelegate }) => {
  return (
    <Button
      data-testid={`delegate-button`}
      onClick={onDelegate}
      variant="outlined"
      color="secondary"
    >
      위임
    </Button>
  );
};

const DisabledDelegateButton = () => {
  return (
    <Tooltip title="읽기 전용 모드입니다. 모든 기능을 사용하려면 Metamask 확장 프로그램을 설치하십시오.">
      <div>
        <Button
          data-testid="delegate-button"
          variant="outlined"
          color="secondary"
          disabled={true}
        >
          위임
        </Button>
      </div>
    </Tooltip>
  );
};

const GuardianDialog = ({
  readOnly,
  dialogState,
  guardian,
  onClose,
  onDelegate
}) => {
  return (
    <Dialog open={dialogState} onClose={onClose}>
      <DialogTitle>
        <span>{guardian.name}</span>
      </DialogTitle>
      <DialogContent data-testid="guardian-dialog">
        <Typography variant="h6" color="textPrimary">
          Guardian에 대한 정보 :
        </Typography>
        <ul>
          <Typography variant="body1" color="textPrimary">
            <li>
              URL:{' '}
              <Link
                href={guardian.url}
                target="_blank"
                rel="noopener noreferrer"
                color="secondary"
                variant="body1"
              >
                {guardian.url}
              </Link>
            </li>
          </Typography>
        </ul>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        {readOnly ? (
          <DisabledDelegateButton />
        ) : (
          <DelegateButton onDelegate={onDelegate} />
        )}
      </DialogActions>
    </Dialog>
  );
};

export default withStyles(styles)(GuardianDialog);
