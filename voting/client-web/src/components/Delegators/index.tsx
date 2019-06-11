/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useState, useEffect } from 'react';
import GuardiansList from './list';
import Link from '@material-ui/core/Link';
import { Mode } from '../../api/interface';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import ManualDelegationDialog from '../ManualDelegation';
import { ApiService } from '../../api';
import { normalizeUrl } from '../../services/urls';
import DelegationStatusDialog from '../DelegationStatusDialog';
import { useTranslation } from 'react-i18next';

const DelegatorsPage = ({ apiService }: { apiService: ApiService }) => {
  const [guardians, setGuardians] = useState({} as {
    [address: string]: {
      address: string;
      name: string;
      url: string;
      stake: string;
      hasEligibleVote: boolean;
    };
  });

  const [
    manualDelegationDialogState,
    setManualDelegationDialogState
  ] = useState(false);

  const [totalStake, setTotalStake] = useState('0');
  const [delegatedTo, setDelegatedTo] = useState('');
  const [delegationCandidate, setDelegationCandidate] = useState('');
  const [nextElectionsBlockHeight, setNextElectionsBlockHeight] = useState('');

  const fetchNextElectionsBlockHeight = async () => {
    const res = await apiService.getNextElectionBlockHeight();
    setNextElectionsBlockHeight(res);
  };

  const fetchTotalStake = async () => {
    const totalStake = await apiService.getTotalStake();
    setTotalStake(totalStake);
  };

  const fetchGuardian = async address => {
    const data = await apiService.getGuardianData(address);
    guardians[address] = {
      address,
      name: data['name'],
      url: normalizeUrl(data['website']),
      stake: data['stake'],
      hasEligibleVote: data['hasEligibleVote']
    };
    setGuardians(Object.assign({}, guardians));
  };

  const fetchGuardians = async () => {
    const addresses = await apiService.getGuardians();
    addresses.forEach(address => fetchGuardian(address));
  };

  const fetchDelegatedTo = async () => {
    if (hasMetamask()) {
      const address = await apiService.getCurrentAddress();
      const res = await apiService.getCurrentDelegation(address);
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
    const receipt = await apiService.delegate(candidate);
    fetchDelegatedTo();
    console.log(receipt);
  };

  const manualDelegateHandler = address => {
    delegate(address);
    setTimeout(() => {
      setManualDelegationDialogState(false);
    }, 100);
  };

  const hasMetamask = () => {
    return apiService.mode === Mode.ReadWrite;
  };

  const { t } = useTranslation();

  const centerContent = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  };

  return (
    <>
      <header style={centerContent}>
        <Typography
          variant="h2"
          component="h2"
          gutterBottom
          color="textPrimary"
        >
          {t('Guardians List')}
        </Typography>
        <DelegationStatusDialog apiService={apiService} />
      </header>

      <div style={centerContent}>
        <Typography variant="body1" gutterBottom color="textPrimary">
          {t('Next election round will take place at Ethereum block') + ':'}{' '}
          <Link
            color="secondary"
            target="_blank"
            rel="noopener"
            href={`//etherscan.io/block/countdown/${nextElectionsBlockHeight}`}
          >
            {nextElectionsBlockHeight}
          </Link>
        </Typography>

        <Typography variant="body1" gutterBottom color="textPrimary">
          {t('Participating stake')}
          {': '}
          {totalStake} Orbs
        </Typography>
      </div>

      <GuardiansList
        delegatedTo={delegatedTo}
        enableDelegation={hasMetamask()}
        guardians={guardians}
        onSelect={setDelegationCandidate}
      />

      {hasMetamask() && (
        <Typography paragraph variant="body1" color="textPrimary">
          {t('Want to delegate manually to another address?')}{' '}
          <Link
            variant="h6"
            color="secondary"
            data-testid="open-manual-delegation-dialog"
            onClick={() => setManualDelegationDialogState(true)}
          >
            {t('Click here')}
          </Link>
          .
        </Typography>
      )}

      <ManualDelegationDialog
        dialogState={manualDelegationDialogState}
        onClose={() => setManualDelegationDialogState(false)}
        onDelegate={manualDelegateHandler}
      />

      <div style={{ textAlign: 'center' }}>
        {hasMetamask() && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => delegate(delegationCandidate)}
          >
            {t('Delegate')}
          </Button>
        )}
      </div>
    </>
  );
};

export default DelegatorsPage;
