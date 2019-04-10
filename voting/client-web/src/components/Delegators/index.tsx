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
import GuardianDialog from '../GuardianDetails';
import Typography from '@material-ui/core/Typography';
import ManualDelegationDialog from '../ManualDelegation';
import { ApiService } from '../../api';
import { normalizeUrl } from '../../services/urls';

const DelegatorsPage = ({ apiService }: { apiService: ApiService }) => {
  const [guardians, setGuardians] = useState({} as {
    [address: string]: { name: string; url: string; stake: string };
  });
  const [selectedGuardian, setSelectedGuardian] = useState('');
  const [guardianDetailsDialogState, setGuardianDetailsDialogState] = useState(
    false
  );
  const [
    manualDelegationDialogState,
    setManualDelegationDialogState
  ] = useState(false);

  const [totalStake, setTotalStake] = useState('0');
  const [delegatedTo, setDelegatedTo] = useState('');

  const fetchTotalStake = async () => {
    const totalStake = await apiService.getTotalStake();
    setTotalStake(totalStake);
  };

  const fetchGuardian = async address => {
    const data = await apiService.getGuardianData(address);
    guardians[address] = {
      name: data['name'],
      url: normalizeUrl(data['website']),
      stake: data['stake']
    };
    setGuardians(Object.assign({}, guardians));
  };

  const fetchGuardians = async () => {
    const addresses = await apiService.getGuardians();
    addresses.forEach(address => fetchGuardian(address));
  };

  const fetchDelegatedTo = async () => {
    if (hasMetamask()) {
      const res = await apiService.getCurrentDelegation();
      setDelegatedTo(res);
    }
  };

  useEffect(() => {
    fetchTotalStake();
    fetchGuardians();
    fetchDelegatedTo();
  }, []);

  const delegate = async candidate => {
    const receipt = await apiService.delegate(candidate);
    fetchDelegatedTo();
    console.log(receipt);
  };

  const delegateHandler = () => {
    delegate(selectedGuardian);
    setTimeout(() => {
      setGuardianDetailsDialogState(false);
    }, 100);
  };

  const manualDelegateHandler = address => {
    delegate(address);
    setTimeout(() => {
      setManualDelegationDialogState(false);
    }, 100);
  };

  const selectGuardian = address => {
    setSelectedGuardian(address);
    setGuardianDetailsDialogState(true);
  };

  const hasMetamask = () => {
    return apiService.mode === Mode.ReadWrite;
  };

  return (
    <>
      <Typography variant="h2" component="h2" gutterBottom color="textPrimary">
        Guardians List
      </Typography>

      {/* <Typography align="right" variant="overline">
        Total stake: {totalStake} Orbs
      </Typography> */}

      <GuardiansList guardians={guardians} onSelect={selectGuardian} />

      {hasMetamask() && (
        <Typography paragraph variant="body1" color="textPrimary">
          Want to delegate manually to another address? Click{' '}
          <Link
            variant="h6"
            color="secondary"
            data-testid="open-manual-delegation-dialog"
            onClick={() => setManualDelegationDialogState(true)}
          >
            here
          </Link>
          .
        </Typography>
      )}

      {hasMetamask() && delegatedTo.length > 0 && (
        <Typography paragraph variant="body1" color="textPrimary">
          Delegation Status: Your vote is going to `{delegatedTo}`.
        </Typography>
      )}

      <GuardianDialog
        readOnly={!hasMetamask()}
        dialogState={guardianDetailsDialogState}
        guardian={Object.assign(
          { address: selectGuardian },
          guardians[selectedGuardian]
        )}
        onClose={() => setGuardianDetailsDialogState(false)}
        onDelegate={delegateHandler}
      />

      <ManualDelegationDialog
        dialogState={manualDelegationDialogState}
        onClose={() => setManualDelegationDialogState(false)}
        onDelegate={manualDelegateHandler}
      />
    </>
  );
};

export default DelegatorsPage;
