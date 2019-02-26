import './App.css';
import Home from '../../pages/Home';
import React, { Component } from 'react';
import GuardianPage from '../../pages/Guardrians';
import Stakeholders from '../../pages/Stakeholders';
import {
  BrowserRouter as Router,
  Route,
  Link,
  RouteProps
} from 'react-router-dom';
import { validatorsContractFactory } from '../../services/contracts';
import MetamaskService from '../../services/metamask';

interface IState {
  validatorsContract: Object;
  metamaskService: MetamaskService;
}

class App extends Component<{}, IState> {
  constructor(props) {
    super(props);
    this.state = {
      validatorsContract: validatorsContractFactory(),
      metamaskService: new MetamaskService()
    };
  }
  componentDidMount() {
    this.state.metamaskService.enable();
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
                <Link to="/stakeholder">Stakeholder</Link>
              </li>
              <li>
                <Link to="/guardian">Guardian</Link>
              </li>
            </ul>
          </nav>
          <main>
            <Route exact path="/" component={Home} />
            <Route path="/stakeholder" component={Stakeholders} />
            <Route
              path="/guardian"
              component={(props: RouteProps) => (
                <GuardianPage
                  {...props}
                  validatorsContract={this.state.validatorsContract}
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
