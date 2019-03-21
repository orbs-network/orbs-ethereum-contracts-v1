import React from 'react';
import Main from '../Main';
import Header from '../Header';
import CssBaseline from '@material-ui/core/CssBaseline';
import { BrowserRouter as Router } from 'react-router-dom';
import { MuiThemeProvider, withStyles } from '@material-ui/core/styles';
import theme from './theme';
import styles from './style';
import classNames from 'classnames';
import { ApiService } from '../../api';
import { Mode } from '../../api/interface';
import { Typography } from '@material-ui/core';

const App = ({ classes }) => {
  const apiService: ApiService = new ApiService();
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {apiService.isMainNet() && (
          <>
            <div className={classes.glass} />
            <div className={classes.glassLabel}>
              <Typography variant="h1">COMING SOON</Typography>
            </div>
          </>
        )}
        <div
          className={classNames({
            [classes.root]: true,
            [classes.blurred]: apiService.isMainNet()
          })}
          data-testid="container"
        >
          <Header isReadOnly={apiService.mode === Mode.ReadOnly} />
          <Main apiService={apiService} />
        </div>
      </MuiThemeProvider>
    </Router>
  );
};

export default withStyles(styles)(App);
