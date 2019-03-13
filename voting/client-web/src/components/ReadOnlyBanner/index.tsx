import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import { SnackbarContent } from '@material-ui/core';
import amber from '@material-ui/core/colors/amber';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  warning: {
    backgroundColor: amber[700]
  }
});

const ReadOnlyBanner = ({ classes }) => {
  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right'
      }}
      open={true}
    >
      <SnackbarContent
        className={classes.warning}
        message="Attention! You are in Read Only mode."
      />
    </Snackbar>
  );
};

export default withStyles(styles)(ReadOnlyBanner);
