/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { withStyles } from '@material-ui/core/styles';
import React from 'react';
import { withRouter } from 'react-router';
import EN_FLAG from './en-us.png';
import JP_FLAG from './jp.png';
import KO_FLAG from './ko.png';

const styles = () => ({
  list: {
    padding: 0,
    margin: 0,
    display: 'inherit',
    listStyle: 'none',
    justifyContent: 'flex-end',
  },
  item: {
    padding: '0 10px',
    '&:hover': {
      opacity: 0.8,
    },
  },
});

function addLangToCurrentLocation(location, lang: string) {
  const langRegexp = /\/(en|ko|jp)\//;
  return location.pathname.match(langRegexp)
    ? location.pathname.replace(langRegexp, `/${lang}/`)
    : `${process.env.PUBLIC_URL}/${lang}${location.pathname}`;
}

const Languages = ({ classes, location }) => {
  return (
    <ul className={classes.list}>
      <li className={classes.item}>
        <a href={addLangToCurrentLocation(location, 'en')}>
          <img src={EN_FLAG} alt='English' />
        </a>
      </li>
      <li className={classes.item}>
        <a href={addLangToCurrentLocation(location, 'jp')}>
          <img src={JP_FLAG} alt='Japanese' />
        </a>
      </li>
      <li className={classes.item}>
        <a href={addLangToCurrentLocation(location, 'ko')}>
          <img src={KO_FLAG} alt='Korean' />
        </a>
      </li>
    </ul>
  );
};

export default withRouter(withStyles(styles)(Languages) as any);
