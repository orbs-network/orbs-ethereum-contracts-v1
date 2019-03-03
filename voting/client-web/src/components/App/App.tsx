import './App.css';
import Home from '../../pages/Home';
import React, { Component } from 'react';
import GuardianPage from '../../pages/Guardrians';
import StakeholderPage from '../../pages/Stakeholders';
import {
  BrowserRouter as Router,
  Route,
  Link,
  RouteProps
} from 'react-router-dom';
import MetamaskService from '../../services/metamask';
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

class App extends Component<{}, IState> {
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
    return (
      <Router basename={process.env.PUBLIC_URL}>
        <div>
          <header />
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/stakeholder" data-hook="nav-stakeholder">
                  Stakeholder
                </Link>
              </li>
              <li>
                <Link to="/guardian">Guardian</Link>
              </li>
            </ul>
          </nav>
          <main>
            <Route exact path="/" component={Home} />
            <Route
              path="/stakeholder"
              component={(props: RouteProps) => (
                <StakeholderPage
                  {...props}
                  votingContract={this.state.votingContract}
                  metamaskService={this.state.metamaskService}
                  guardiansContract={this.state.guardiansContract}
                />
              )}
            />
            <Route
              path="/guardian"
              component={(props: RouteProps) => (
                <GuardianPage
                  {...props}
                  validatorsContract={this.state.validatorsContract}
                  votingContract={this.state.votingContract}
                  metamaskService={this.state.metamaskService}
                />
              )}
            />
          </main>
          <footer />
        </div>
      </Router>
    );
  }
}

export default App;
