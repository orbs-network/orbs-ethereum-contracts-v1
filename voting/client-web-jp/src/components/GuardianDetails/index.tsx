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
      委任
    </Button>
  );
};

const DisabledDelegateButton = () => {
  return (
    <Tooltip title="投票ができるようにMetamaskブラウザーエクステンションをインストールしてください">
      <div>
        <Button
          data-testid="delegate-button"
          variant="outlined"
          color="secondary"
          disabled={true}
        >
          委任
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
          ガーディアンに関する情報：
        </Typography>
        <ul>
          <Typography variant="body1" color="textPrimary">
            <li>
              ウェブサイト:{' '}
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
        <Button onClick={onClose}>キャンセル</Button>
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
