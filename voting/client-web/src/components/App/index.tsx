import Main from '../Main';
import Header from '../Header';
import React, { Component } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { BrowserRouter as Router } from 'react-router-dom';
import {
  MuiThemeProvider,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import theme from './theme';
import styles from './style';
import ReadOnlyBanner from '../ReadOnlyBanner';
import { ApiService } from '../../api';
import { Mode } from '../../api/interface';

class App extends Component<WithStyles> {
  apiService: ApiService;
  constructor(props) {
    super(props);
    this.apiService = new ApiService();
  }
  render() {
    const { classes } = this.props;
    return (
      <Router basename={process.env.PUBLIC_URL}>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <div className={classes.root}>
            <Header />
            <Main apiService={this.apiService} />
            {this.apiService.mode === Mode.ReadOnly ? <ReadOnlyBanner /> : null}
          </div>
        </MuiThemeProvider>
      </Router>
    );
  }
}

export default withStyles(styles)(App);
