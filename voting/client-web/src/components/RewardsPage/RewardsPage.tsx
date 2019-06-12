/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useState, useEffect } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import { ApiService } from '../../api/ApiService';
import { Location } from 'history';
import { parse as parseQuery } from 'querystring';
import { RewardsTable } from './RewardsTable';
import { DelegationInfoTable } from './DelegationInfoTable';
import { useTranslation } from 'react-i18next';

const styles = theme => ({
  form: {
    display: 'flex',
    flexDirection: 'row' as any,
    alignItems: 'baseline',
    width: '50%',
  },
  input: {
    flexGrow: 1,
  },
  submit: {
    marginLeft: 30,
  },
  section: {
    marginTop: `${theme.spacing.unit * 8}px`,
  },
});

const RewardsPageImpl = ({
  classes,
  apiService,
  location,
}: {
  classes: any;
  apiService: ApiService;
  location?: Location;
}) => {
  const [address, setAddress] = useState('');
  const [rewards, setRewards] = useState({});
  const [delegatorInfo, setDelegatorInfo] = useState({});
  const [guardianInfo, setGuardianInfo] = useState({});
  const [electionBlock, setElectionBlock] = useState('0');

  const fetchRewards = address => apiService.getRewards(address).then(setRewards);

  const fetchDelegationInfo = async address => {
    const info = await apiService.getCurrentDelegationInfo(address);
    setDelegatorInfo(info);
    const guardianData = await apiService.getGuardianData(info['delegatedTo']);
    setGuardianInfo(guardianData);
  };

  const fetchPastElectionBlock = () => apiService.getPastElectionBlockHeight().then(setElectionBlock);

  const submitHandler = () => {
    fetchRewards(address);
    fetchDelegationInfo(address);
  };

  useEffect(() => {
    fetchPastElectionBlock();

    if (!location!.search) {
      return;
    }

    const queryParams: any = parseQuery(location!.search.substr(1));
    setAddress(queryParams.address);
    fetchRewards(queryParams.address);
    fetchDelegationInfo(queryParams.address);
  }, []);

  const { t } = useTranslation();
  return (
    <>
      <Typography variant='h2' component='h2' gutterBottom color='textPrimary'>
        {t('Rewards & Delegation Info')}
      </Typography>

      <FormControl className={classes.form} variant='standard' margin='normal'>
        <TextField
          required
          className={classes.input}
          placeholder={t('Enter the address')}
          value={address}
          onChange={ev => setAddress(ev.target.value)}
          margin='normal'
          variant='standard'
        />
        <div className={classes.submit}>
          <Button onClick={submitHandler} variant='outlined'>
            {t('Submit')}
          </Button>
        </div>
      </FormControl>

      <section className={classes.section}>
        <Typography variant='h4' component='h4' gutterBottom color='textPrimary'>
          {t('Rewards')}
        </Typography>
        <RewardsTable rewards={rewards} />
      </section>

      <section className={classes.section}>
        <Typography variant='h4' component='h4' gutterBottom color='textPrimary'>
          {t('Delegation Details')}
        </Typography>
        <DelegationInfoTable delegatorInfo={delegatorInfo} guardianInfo={guardianInfo} />
      </section>

      <section className={classes.section}>
        <Typography inline variant='subtitle1' color='textPrimary'>
          {'* '}
          {t('The information above corresponds to elections at block number')}
          {': '}
        </Typography>
        <Typography inline variant='subtitle1' color='secondary'>
          {electionBlock}
        </Typography>
      </section>
    </>
  );
};

export const RewardsPage = withStyles(styles)(RewardsPageImpl);
