import './App.css';
import Home from '../../pages/Home';
import React, { Component } from 'react';
import Guardians from '../../pages/Guadrians';
import Stakeholders from '../../pages/Stakeholders';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

class App extends Component {
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
            <Route path="/guardian" component={Guardians} />
          </main>
          <footer />
        </div>
      </Router>
    );
  }
}

export default App;
