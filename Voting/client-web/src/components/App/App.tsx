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
import validatorsAbiJson from '../../contracts/OrbsValidators.json';
import Web3 from 'web3';

const initValidatorsContract = () => {
  const validatorsContractAddress =
    '0xD3a92e0341307432FC6cD388F345a81adc992cC5';
  const web3 = new Web3(ethereum as any);
  return new web3.eth.Contract(
    validatorsAbiJson.abi as any,
    validatorsContractAddress
  );
};

const enableMetamask = (): Promise<string> => {
  return ethereum.enable().then(
    (addresses: string[]) => {
      return addresses[0];
    },
    (err: any) => {
      console.warn(err);
      return Promise.reject();
    }
  );
};

class App extends Component<{}, { validatorsContract: Object }> {
  constructor(props) {
    super(props);
    this.state = {
      validatorsContract: initValidatorsContract()
    };
  }
  componentDidMount() {
    enableMetamask();
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
