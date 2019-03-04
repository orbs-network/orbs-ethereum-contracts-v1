import './App.css';
import Main from '../Main';
import Header from '../Header';
import Sidebar from '../Sidebar';
import React, { Component } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { BrowserRouter as Router } from 'react-router-dom';
import MetamaskService from '../../services/metamask';
import {
  MuiThemeProvider,
  createMuiTheme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import {
  validatorsContractFactory,
  guardiansContractFactory,
  votingContractFactory
} from '../../services/contracts';

interface IState {
  validatorsContract: Object;
  guardiansContract: Object;
  votingContract: Object;
  metamaskService: MetamaskService;
}

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: { main: '#09142c' },
    secondary: { main: '#74f6fd' },
    background: {
      default: '#0a0f25',
      paper: '#192a45'
    }
  },
  typography: {
    useNextVariants: true
  }
});

const styles = () => ({
  root: {
    display: 'flex'
  }
});

class App extends Component<WithStyles, IState> {
  constructor(props) {
    super(props);
    this.state = {
      validatorsContract: validatorsContractFactory(),
      guardiansContract: guardiansContractFactory(),
      votingContract: votingContractFactory(),
      metamaskService: new MetamaskService()
    };
  }
  async componentDidMount() {
    await this.state.metamaskService.enable();
  }
  render() {
    const { classes } = this.props;
    return (
      <Router basename={process.env.PUBLIC_URL}>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <div className={classes.root}>
            <Header />
            <Sidebar />
            <Main {...this.state} />
          </div>
        </MuiThemeProvider>
      </Router>
    );
  }
}

export default withStyles(styles)(App);
