/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Alert from '@material-ui/lab/Alert';
import { useBoolean } from 'react-hanger';
import { RewardsHistoryTable } from './RewardsHistoryTable';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../services/ApiContext';
import { DelegationInfoTable } from './DelegationInfoTable';
import { RewardsTable } from './RewardsTable';
import { useQueryParam, StringParam } from 'use-query-params';
import { RouteProps } from 'react-router';
import { ICommonPageProps } from '../../types/pageTypes';
import { fullOrbsFromWeiOrbs } from '../../cryptoUtils/unitConverter';
import { renderToString } from 'react-dom/server';
import { IRewardsDistributionEvent } from 'orbs-pos-data';

const useStyles = makeStyles(theme => ({
  form: {
    display: 'flex',
    flexDirection: 'row',
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
    marginTop: `${theme.spacing(8)}px`,
  },
  alert: {
    width: '60%',
  },
}));

interface IDelegatorStakingInfo {
  stakedOrbs: number;
  selectedGuardianAddress: string;
}

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

// TODO : C.F.H : We need to have the unstaked orbs balance (now, if thee address has no delgation, we will not get its balance neither)
//  and then, we can add a flag of 'hasOrbs'

// TODO : FUTURE : O.L : This type should be defined and taken from
//  DEV_NOTE : There might be more possible values (for now we are just interested in whether it is delegated or not)
type TDelegationTypes = 'Not-Delegated' | 'Transfer';
const NOT_DELEGATED: TDelegationTypes = 'Not-Delegated';

export const RewardsPage = React.memo<ICommonPageProps>(() => {
  const classes = useStyles();
  const { t } = useTranslation();
  const showNoSelectedGuardianError = useBoolean(false);
  const showAddressNotParticipatingAlert = useBoolean(false);
  const { remoteService, stakingService, guardiansService, orbsRewardsService } = useApi();
  const [formAddress, setFormAddress] = useState('');
  const [rewards, setRewards] = useState({});
  const [distributionsHistory, setDistributionsHistory] = useState<IRewardsDistributionEvent[]>([]);
  const [delegatorInfo, setDelegatorInfo] = useState<object>({});
  const [delegatorStakingInfo, setDelegatorStakingInfo] = useState<IDelegatorStakingInfo>({
    stakedOrbs: 0,
    selectedGuardianAddress: EMPTY_ADDRESS,
  });
  const [guardianInfo, setGuardianInfo] = useState({});
  const [electionBlock, setElectionBlock] = useState('0');

  const [queryAddress, setQueryAddress] = useQueryParam('address', StringParam);

  const fetchRewards = useCallback(async address => remoteService.getRewards(address).then(setRewards), [
    remoteService,
  ]);
  const fetchRewardsHistory = useCallback(
    address =>
      orbsRewardsService
        .readRewardsDistributionsHistory(address)
        .then(distributionsHistory => setDistributionsHistory(distributionsHistory)),
    [orbsRewardsService],
  );

  const fetchDelegationInfo = useCallback(
    async address => {
      const delegatorInfo: any = await remoteService.getCurrentDelegationInfo(address);
      setDelegatorInfo(delegatorInfo);

      if (delegatorInfo.delegationType === 'Not-Delegated') {
        setGuardianInfo({});
      } else {
        const guardianData = await remoteService.getGuardianData(delegatorInfo['delegatedTo']);
        setGuardianInfo(guardianData);
      }
    },
    [remoteService],
  );

  const fetchStakingInfoForAddress = useCallback(
    async address => {
      const stakedOrbsInWeiOrbs = await stakingService.readStakeBalanceOf(address);
      const selectedGuardianAddress = await guardiansService.readSelectedGuardianAddress(address);
      const fullStakedOrbs = fullOrbsFromWeiOrbs(stakedOrbsInWeiOrbs);

      setDelegatorStakingInfo({ stakedOrbs: fullStakedOrbs, selectedGuardianAddress });
    },
    [stakingService, guardiansService],
  );

  const fetchAllDataForAddress = useCallback(
    async (accountAddress: string) => {
      fetchRewards(accountAddress);
      fetchRewardsHistory(accountAddress);
      fetchDelegationInfo(accountAddress);
      fetchStakingInfoForAddress(accountAddress).catch(e => console.error('Error fetching staking info', e));
    },
    [fetchRewards, fetchRewardsHistory, fetchDelegationInfo, fetchStakingInfoForAddress],
  );

  const fetchEffectiveElectionBlock = useCallback(
    () => remoteService.getEffectiveElectionBlockNumber().then(setElectionBlock),
    [remoteService],
  );

  const submitHandler = useCallback(async () => {
    setQueryAddress(formAddress, 'pushIn');
  }, [setQueryAddress, formAddress]);

  // Updates rewards data based on the query address param
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

  const hasUnstakedOrbs = (delegatorInfo as any).delegatorBalance > 0;
  const hasStakedOrbs = delegatorStakingInfo.stakedOrbs > 0;
  // DEV_NOTE : 'delegatorStakingInfo' requires being on the right network, 'delegatorInfo' does not, so for now we
  //             will use them both as our flag
  const isDelegatedGuardianAddressValidByStakingInfo = delegatorStakingInfo.selectedGuardianAddress !== EMPTY_ADDRESS;
  const isDelegatedGuardianAddressValidByDelegatorInfo = (delegatorInfo as any).delegatedTo !== EMPTY_ADDRESS;
  const isDelegatedGuardianAddressValid =
    isDelegatedGuardianAddressValidByStakingInfo || isDelegatedGuardianAddressValidByDelegatorInfo;

  const hasDelegatedGuardian = (delegatorInfo as any).delegationType !== NOT_DELEGATED;

  const hasAddress = !!queryAddress;
  const hasSelectedGuardian = hasDelegatedGuardian && isDelegatedGuardianAddressValid;
  const isActiveInStaking = hasStakedOrbs && hasSelectedGuardian;

  // Checks if any alerts should be displayed
  useEffect(() => {
    if (!hasAddress) {
      showNoSelectedGuardianError.setFalse();
      showAddressNotParticipatingAlert.setFalse();

      return;
    }

    // Do we have staked ORBS but no guardian selected ?
    if (hasStakedOrbs && !hasSelectedGuardian) {
      showNoSelectedGuardianError.setTrue();
    } else {
      showNoSelectedGuardianError.setFalse();
    }

    // Do we have a selected guardian but we are not staking yet ?
    if (!hasStakedOrbs && hasUnstakedOrbs) {
      showAddressNotParticipatingAlert.setTrue();
    } else {
      showAddressNotParticipatingAlert.setFalse();
    }
  }, [showNoSelectedGuardianError, showAddressNotParticipatingAlert, hasAddress, hasStakedOrbs, hasSelectedGuardian]);

  const tetraUrl = 'https://tetra.com';

  // TODO : Find a better way to combine the translations with changing order links
  const goToTetraLinkInnerHtml = t('action_goToTetra', {
    tetraLink: renderToString(
      <a style={{ color: 'inherit' }} target={'_blank'} rel={'noopener noreferrer'} href={tetraUrl}>
        {t('text_tetraName')}
      </a>,
    ),
  });

  const stakeAndDelegateWithTetraLinkInnerHtml = t('action_youCanStakeYourORBSAndSelectAGuardianWithTetra', {
    tetraLink: renderToString(
      <a style={{ color: 'inherit' }} target={'_blank'} rel={'noopener noreferrer'} href={tetraUrl}>
        {t('text_tetraName')}
      </a>,
    ),
  });

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

      {showNoSelectedGuardianError.value && (
        <Alert className={classes.alert} severity='error'>
          <Typography>{t('alert_stakingWithoutGuardian')}</Typography> <br /> <br />{' '}
          <Typography dangerouslySetInnerHTML={{ __html: stakeAndDelegateWithTetraLinkInnerHtml }}></Typography>
        </Alert>
      )}

      {showAddressNotParticipatingAlert.value && (
        <Alert className={classes.alert} severity='info'>
          <Typography>{t('alert_notParticipating')}</Typography> <br /> <br />{' '}
          <Typography dangerouslySetInnerHTML={{ __html: stakeAndDelegateWithTetraLinkInnerHtml }}></Typography>
        </Alert>
      )}

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
        <RewardsHistoryTable distributionsHistory={distributionsHistory} />
      </section>

      <section className={classes.section}>
        <Typography variant='h4' component='h4' gutterBottom color='textPrimary'>
          {t('Delegation Details')}
        </Typography>
        <DelegationInfoTable
          delegatorStakingInfo={delegatorStakingInfo}
          delegatorInfo={delegatorInfo}
          guardianInfo={guardianInfo}
        />
      </section>

      <section className={classes.section}>
        <Typography display={'inline'} variant='subtitle1' color='textSecondary'>
          {'* '}
          {t('The information above corresponds to elections at block number')}
          {': '}
        </Typography>
        <Typography display={'inline'} variant='subtitle1' color='secondary'>
          {parseInt(electionBlock, 10).toLocaleString()}
        </Typography>
      </section>
    </>
  );
});
