/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import JP_FLAG from './jp.png';
import KO_FLAG from './ko.png';
import EN_FLAG from './en-us.png';
import { withStyles } from '@material-ui/core/styles';
import { useTranslation } from 'react-i18next';

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
      opacity: 0.8
    }
  }
});

const Languages = ({ classes }) => {
  const { t, i18n } = useTranslation();
  return (
    <ul className={classes.list}>
      <li className={classes.item}>
        <a
          href="#"
          onClick={e => {
            e.preventDefault();
            i18n.changeLanguage('en');
          }}
        >
          <img src={EN_FLAG} alt="English" />
        </a>
      </li>
      <li className={classes.item}>
        <a
          href="#"
          onClick={e => {
            e.preventDefault();
            i18n.changeLanguage('jp');
          }}
        >
          <img src={JP_FLAG} alt="Japanese" />
        </a>
      </li>
      <li className={classes.item}>
        <a
          href="#"
          onClick={e => {
            e.preventDefault();
            i18n.changeLanguage('ko');
          }}
        >
          <img src={KO_FLAG} alt="Korean" />
        </a>
      </li>
    </ul>
  );
};

export default withStyles(styles)(Languages);
