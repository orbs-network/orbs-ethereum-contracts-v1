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
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useApi } from '../../services/ApiContext';
import { normalizeUrl } from '../../services/urls';
import { DelegationStatusDialog } from '../DelegationStatusDialog/DelegationStatusDialog';
import { ManualDelegationDialog } from '../ManualDelegationDialog/ManualDelegationDialog';
import { GuardiansList } from './GuardiansList';

export const DelegatorsPage = () => {
  const { remoteService, metamask } = useApi();
  const [guardians, setGuardians] = useState({} as {
    [address: string]: {
      address: string;
      name: string;
      url: string;
      stake: string;
      hasEligibleVote: boolean;
    };
  });

  const [manualDelegationDialogState, setManualDelegationDialogState] = useState(false);

  const [totalStake, setTotalStake] = useState('0');
  const [delegatedTo, setDelegatedTo] = useState('');
  const [delegationCandidate, setDelegationCandidate] = useState('');
  const [nextElectionsBlockHeight, setNextElectionsBlockHeight] = useState('');

  const fetchNextElectionsBlockHeight = async () => {
    const res = await remoteService.getNextElectionBlockHeight();
    setNextElectionsBlockHeight(res);
  };

  const fetchTotalStake = async () => {
    const totalStake = await remoteService.getTotalStake();
    setTotalStake(totalStake);
  };

  const fetchGuardian = async address => {
    const data = await remoteService.getGuardianData(address);
    guardians[address] = {
      address,
      name: data['name'],
      url: normalizeUrl(data['website']),
      stake: data['stake'],
      hasEligibleVote: data['hasEligibleVote'],
    };
    setGuardians(Object.assign({}, guardians));
  };

  const fetchGuardians = async () => {
    const addresses = await remoteService.getGuardians();
    addresses.forEach(address => fetchGuardian(address));
  };

  const fetchDelegatedTo = async () => {
    if (metamask) {
      const address = await metamask.getCurrentAddress();
      const res = await remoteService.getCurrentDelegation(address);
      setDelegatedTo(res);
    }
  };

  useEffect(() => {
    fetchTotalStake();
    fetchGuardians();
    fetchDelegatedTo();
    fetchNextElectionsBlockHeight();
  }, []);

  const delegate = async candidate => {
    if (metamask) {
      const receipt = await metamask.delegate(candidate);
      fetchDelegatedTo();
      console.log(receipt);
    }
  };

  const manualDelegateHandler = address => {
    delegate(address);
    setTimeout(() => {
      setManualDelegationDialogState(false);
    }, 100);
  };

  const { t } = useTranslation();

  const centerContent = {
    display: 'flex',
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
    <>
      <header style={centerContent}>
        <Typography variant='h2' component='h2' gutterBottom color='textPrimary'>
          {t('Guardians List')}
        </Typography>
        <DelegationStatusDialog remoteService={remoteService} />
      </header>

      <div style={centerContent}>
        <Typography variant='body1' gutterBottom color='textPrimary'>
          {t('Next election round will take place at Ethereum block') + ':'}{' '}
          <Link
            color='secondary'
            target='_blank'
            rel='noopener'
            href={`//etherscan.io/block/countdown/${nextElectionsBlockHeight}`}
          >
            {nextElectionsBlockHeight}
          </Link>
        </Typography>

        <Typography variant='body1' gutterBottom color='textPrimary'>
          {t('Participating stake')}
          {': '}
          {totalStake} Orbs
        </Typography>
      </div>

      <GuardiansList
        delegatedTo={delegatedTo}
        enableDelegation={metamask !== undefined}
        guardians={guardians}
        onSelect={setDelegationCandidate}
      />

      {metamask && (
        <Typography paragraph variant='body1' color='textPrimary'>
          <Trans i18nKey='delegateMessage'>Want to delegate manually to another address? Click {hereElement}.</Trans>
        </Typography>
      )}

      <ManualDelegationDialog
        dialogState={manualDelegationDialogState}
        onClose={() => setManualDelegationDialogState(false)}
        onDelegate={manualDelegateHandler}
      />

      <div style={{ textAlign: 'center' }}>
        {metamask && (
          <Button variant='outlined' color='secondary' onClick={() => delegate(delegationCandidate)}>
            {t('Delegate')}
          </Button>
        )}
      </div>
    </>
  );
};
