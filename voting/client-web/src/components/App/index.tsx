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
import { RemoteStrategy } from '../../api/remote';
import { MetamaskStrategy } from '../../api/metamask';
import { IApiStrategy, Strategies } from '../../api/interface';

class App extends Component<WithStyles> {
  apiService: IApiStrategy;
  constructor(props) {
    super(props);
    if (window['ethereum']) {
      this.apiService = new MetamaskStrategy();
    } else {
      this.apiService = new RemoteStrategy();
    }
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
            {this.apiService.type === Strategies.remote ? (
              <ReadOnlyBanner />
            ) : null}
          </div>
        </MuiThemeProvider>
      </Router>
    );
  }
}

export default withStyles(styles)(App);
