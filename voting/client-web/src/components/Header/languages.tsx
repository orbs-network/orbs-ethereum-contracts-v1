import React from 'react';
import JP_FLAG from './jp.png';
import EN_FLAG from './en-us.png';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
  list: {
    padding: 0,
    margin: 0,
    display: 'inherit',
    listStyle: 'none',
    justifyContent: 'flex-end'
  },
  item: {
    padding: '0 10px',
    '&:hover': {
      opacity: .8
    }
  }
});

const Languages = ({ classes }) => {
  return (
    <ul className={classes.list}>
      <li className={classes.item}>
        <a href="https://orbs-network.github.io/voting">
          <img src={EN_FLAG} alt="English" />
        </a>
      </li>
      <li className={classes.item}>
        <a href="https://orbs-network.github.io/voting-jp">
          <img src={JP_FLAG} alt="Japanese" />
        </a>
      </li>
    </ul>
  );
};

export default withStyles(styles)(Languages);
