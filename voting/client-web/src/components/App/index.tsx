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
import MetamaskStrategy from '../../api/metamask';
import { IApiStrategy } from '../../api/interface';

class App extends Component<WithStyles> {
  communicationStrategy: IApiStrategy;
  constructor(props) {
    super(props);
    this.communicationStrategy = new MetamaskStrategy();
  }
  render() {
    const { classes } = this.props;
    return (
      <Router basename={process.env.PUBLIC_URL}>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <div className={classes.root}>
            <Header />
            <Main apiService={this.communicationStrategy} />
          </div>
        </MuiThemeProvider>
      </Router>
    );
  }
}

export default withStyles(styles)(App);
