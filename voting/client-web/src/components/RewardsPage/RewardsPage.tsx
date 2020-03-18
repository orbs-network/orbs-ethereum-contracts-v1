/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { Location } from 'history';
import { parse as parseQuery } from 'querystring';
import React, { useCallback, useEffect, useState } from 'react';
import { RewardsHistoryTable } from './RewardsHistoryTable';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../services/ApiContext';
import { DelegationInfoTable } from './DelegationInfoTable';
import { RewardsTable } from './RewardsTable';
import { useQueryParam, StringParam } from 'use-query-params';

const styles = theme => ({
  form: {
    display: 'flex',
    flexDirection: 'row' as any,
    alignItems: 'baseline',
    width: '60%',
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

const RewardsPageImpl = ({ classes }: { classes: any }) => {
  const { remoteService } = useApi();
  const [formAddress, setFormAddress] = useState('');
  const [rewards, setRewards] = useState({});
  const [rewardsHistory, setRewardsHistory] = useState([]);
  const [delegatorInfo, setDelegatorInfo] = useState({});
  const [guardianInfo, setGuardianInfo] = useState({});
  const [electionBlock, setElectionBlock] = useState('0');

  const [queryAddress, setQueryAddress] = useQueryParam('address', StringParam);

  const fetchRewards = useCallback(async address => remoteService.getRewards(address).then(setRewards), [
    remoteService,
  ]);
  const fetchRewardsHistory = useCallback(address => remoteService.getRewardsHistory(address).then(setRewardsHistory), [
    remoteService,
  ]);

  const fetchDelegationInfo = useCallback(
    async address => {
      const info: any = await remoteService.getCurrentDelegationInfo(address);
      setDelegatorInfo(info);
      if (info.delegationType === 'Not-Delegated') {
        setGuardianInfo({});
      } else {
        const guardianData = await remoteService.getGuardianData(info['delegatedTo']);
        setGuardianInfo(guardianData);
      }
    },
    [remoteService],
  );

  const fetchAllDataForAddress = useCallback(
    async (accountAddress: string) => {
      fetchRewards(accountAddress);
      fetchRewardsHistory(accountAddress);
      fetchDelegationInfo(accountAddress);
    },
    [fetchRewards, fetchRewardsHistory, fetchDelegationInfo],
  );

  const fetchEffectiveElectionBlock = useCallback(
    () => remoteService.getEffectiveElectionBlockNumber().then(setElectionBlock),
    [remoteService],
  );

  const submitHandler = useCallback(async () => {
    setQueryAddress(formAddress, 'pushIn');
  }, [setQueryAddress, formAddress]);

  useEffect(() => {
    async function asyncInnerFunction() {
      await fetchEffectiveElectionBlock();

      if (!queryAddress) {
        return;
      }

      setFormAddress(queryAddress);

      await fetchAllDataForAddress(queryAddress);
    }

    asyncInnerFunction();
  }, [fetchAllDataForAddress, fetchEffectiveElectionBlock, queryAddress]);

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
          value={formAddress}
          onChange={ev => setFormAddress(ev.target.value)}
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
          {t('Distributed')}
        </Typography>
        <RewardsHistoryTable rewardsHistory={rewardsHistory} />
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
          {parseInt(electionBlock, 10).toLocaleString()}
        </Typography>
      </section>
    </>
  );
};

export const RewardsPage = withStyles(styles)(RewardsPageImpl);
