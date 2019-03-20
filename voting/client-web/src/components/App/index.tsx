import React from 'react';
import Main from '../Main';
import Header from '../Header';
import CssBaseline from '@material-ui/core/CssBaseline';
import { BrowserRouter as Router } from 'react-router-dom';
import { MuiThemeProvider, withStyles } from '@material-ui/core/styles';
import theme from './theme';
import styles from './style';
import { ApiService } from '../../api';
import { Mode } from '../../api/interface';

const App = ({ classes }) => {
  const apiService = new ApiService();
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <div className={classes.root} data-testid="container">
          <Header isReadOnly={apiService.mode === Mode.ReadOnly} />
          <Main apiService={apiService} />
        </div>
      </MuiThemeProvider>
    </Router>
  );
};

export default withStyles(styles)(App);
