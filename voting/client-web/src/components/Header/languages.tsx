/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import { withStyles } from '@material-ui/core/styles';
import React from 'react';
import { ChangeLangLink } from '../multi-lang/ChangeLangLink';
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
    // padding: '0 10px',
    paddingInlineStart: '20px',
    '&:hover': {
      opacity: 0.8,
    },
  },
});

const LanguagesImpl = ({ classes }) => {
  return (
    <ul className={classes.list}>
      <li className={classes.item}>
        <ChangeLangLink lang='en'>
          <img src={EN_FLAG} alt='English' />
        </ChangeLangLink>
      </li>
      <li className={classes.item}>
        <ChangeLangLink lang='jp'>
          <img src={JP_FLAG} alt='Japanese' />
        </ChangeLangLink>
      </li>
      <li className={classes.item}>
        <ChangeLangLink lang='ko'>
          <img src={KO_FLAG} alt='Korean' />
        </ChangeLangLink>
      </li>
    </ul>
  );
};

export const Languages = withStyles(styles)(LanguagesImpl);
