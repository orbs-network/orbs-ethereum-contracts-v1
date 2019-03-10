import React from 'react';
import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import { withStyles } from '@material-ui/core/styles';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';

const styles = () => ({});

const GuardianDialog = ({ dialogState, guardian, onClose, onDelegate }) => {
  return (
    <Dialog open={dialogState} onClose={onClose}>
      <DialogTitle>
        <span>{guardian.name}</span>
      </DialogTitle>
      <DialogContent data-testid="guardian-dialog">
        <Typography variant="h6" color="textPrimary">
          Information about the Guardian:
        </Typography>
        <ul>
          <Typography variant="body1" color="textPrimary">
            <li>
              Url:{' '}
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
        <Button onClick={onClose}>Cancel</Button>
        <Button
          data-testid={`delegate-button`}
          onClick={onDelegate}
          variant="outlined"
          color="secondary"
        >
          Delegate
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withStyles(styles)(GuardianDialog);
