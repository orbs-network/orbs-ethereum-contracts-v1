import React from 'react';
import App from './index';
import { render } from 'react-testing-library';

export default class AppDriver {
  render() {
    return render(<App />);
  }
}
