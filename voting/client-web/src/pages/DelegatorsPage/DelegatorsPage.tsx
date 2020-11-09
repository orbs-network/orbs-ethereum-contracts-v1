/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useApi } from '../../services/ApiContext';
import { DelegationStatusDialog } from '../../components/DelegationStatusDialog/DelegationStatusDialog';
import { ManualDelegationDialog } from '../../components/ManualDelegationDialog/ManualDelegationDialog';
import { GuardiansList } from './GuardiansList';
import { useGuardiansStore, useOrbsNodeStore } from '../../Store/storeHooks';
import { observer } from 'mobx-react';
import { Page } from '../../components/structure/Page';
import { GuardiansTable } from '../../components/Shared/GuardiansTable/GuardiansTable';
import { useGuardiansDelegatorsCut } from '../../services/v2/v2ServicesHooks';
import { useOrbsStakingRewardsService } from '../../services/ServicesHooks';

// TODO : O.L : Add loading indicator
export const DelegatorsPage = observer(() => {
  const { remoteService, metamask } = useApi();
  const guardiansStore = useGuardiansStore();
  const orbsNodeStore = useOrbsNodeStore();
  const stakingRewardsService = useOrbsStakingRewardsService();

  const [manualDelegationDialogState, setManualDelegationDialogState] = useState(false);

  const [totalParticipatingTokens, setTotalParticipatingTokens] = useState('0');
  const [delegatedTo, setDelegatedTo] = useState('');
  const [delegationCandidate, setDelegationCandidate] = useState('');
  const [upcomingElectionsBlockNumber, setUpcomingElectionsBlockNumber] = useState('');

  const fetchUpcomingElectionsBlockNumber = useCallback(async () => {
    const res = await remoteService.getUpcomingElectionBlockNumber();
    setUpcomingElectionsBlockNumber(Number(res).toLocaleString());
  }, [remoteService]);

  const fetchTotalParticipatingTokens = useCallback(async () => {
    const totalParticipatingTokens = await remoteService.getTotalParticipatingTokens();
    setTotalParticipatingTokens(Number(totalParticipatingTokens).toLocaleString());
  }, [remoteService]);

  const fetchDelegatedTo = useCallback(async () => {
    if (metamask) {
      const address = await metamask.getCurrentAddress();
      const res = await remoteService.getCurrentDelegation(address);
      setDelegatedTo(res);
    }
  }, [metamask, remoteService]);

  // TODO : Fix this loading
  useEffect(() => {
    fetchTotalParticipatingTokens();
    fetchDelegatedTo();
    fetchUpcomingElectionsBlockNumber();
  }, [fetchDelegatedTo, fetchTotalParticipatingTokens, fetchUpcomingElectionsBlockNumber]);

  const delegate = useCallback(
    async (candidateAddress) => {
      if (metamask) {
        const receipt = await metamask.delegate(candidateAddress);
        fetchDelegatedTo();
      }
    },
    [fetchDelegatedTo, metamask],
  );

  const guardianAddressToDelegatorsCut = useGuardiansDelegatorsCut(orbsNodeStore.guardians, stakingRewardsService);


  const manualDelegateHandler = (address) => {
    delegate(address);
    setTimeout(() => {
      setManualDelegationDialogState(false);
    }, 100);
  };

  const { t } = useTranslation();

  const centerContent: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  };

  const hereElement = (
    <Link
      variant='h6'
      color='secondary'
      data-testid='open-manual-delegation-dialog'
      onClick={() => setManualDelegationDialogState(true)}
    >
      here
    </Link>
  );

  return (
    <Page>
      {/*<header style={centerContent}>*/}
      {/*  <Typography variant='h2' component='h2' gutterBottom color='textPrimary'>*/}
      {/*    {t('Guardians List')}*/}
      {/*  </Typography>*/}
      {/*  <DelegationStatusDialog remoteService={remoteService} />*/}
      {/*</header>*/}

      {/*<div style={centerContent}>*/}
      {/*  <Typography variant='body1' gutterBottom color='textPrimary'>*/}
      {/*    {t('Participating stake')}*/}
      {/*    {': '}*/}
      {/*    {totalParticipatingTokens} ORBS*/}
      {/*  </Typography>*/}
      {/*</div>*/}

      {guardiansStore.doneLoading}
      {!orbsNodeStore.doneLoading && <Typography>{t('Loading')}...</Typography>}
      {orbsNodeStore.doneLoading && (
        <GuardiansTable
          guardianSelectionMode={'None'}
          selectedGuardian={''}
          guardians={orbsNodeStore.guardians}
          onGuardianSelect={() => null}
          committeeMembers={orbsNodeStore.committeeMembers}
          // guardiansToDelegatorsCut={guardianAddressToDelegatorsCut}
          guardiansToDelegatorsCut={guardianAddressToDelegatorsCut}
        />
      )}
    </Page>
  );
});
