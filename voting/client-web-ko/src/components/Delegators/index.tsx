/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React, { useState, useEffect } from 'react';
import GuardiansList from './list';
import { Mode } from '../../api/interface';
import GuardianDialog from '../GuardianDetails';
import Typography from '@material-ui/core/Typography';
import { ApiService } from '../../api';
import { normalizeUrl } from '../../services/urls';

const DelegatorsPage = ({ apiService }: { apiService: ApiService }) => {
  const [guardians, setGuardians] = useState({} as {
    [address: string]: {
      name: string;
      url: string;
      stake: string;
      hasEligibleVote: boolean;
    };
  });
  const [selectedGuardian, setSelectedGuardian] = useState('');
  const [guardianDetailsDialogState, setGuardianDetailsDialogState] = useState(
    false
  );

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
        Guardians 목록
      </Typography>

      {/* <Typography align="right" variant="overline">
        전체 지분 : {totalStake} Orbs
      </Typography> */}

      <GuardiansList guardians={guardians} onSelect={selectGuardian} />

      {hasMetamask() && delegatedTo.length > 0 && (
        <Typography paragraph variant="body1" color="textPrimary">
          위임 상태 : 귀하의 투표는 `{delegatedTo}`.
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
    </>
  );
};

export default DelegatorsPage;
