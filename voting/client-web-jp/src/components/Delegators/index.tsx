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
import Typography from '@material-ui/core/Typography';
import { ApiService } from '../../api';
import { normalizeUrl } from '../../services/urls';
import Explanations from './explanations';

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

  const [totalStake, setTotalStake] = useState('0');
  const [delegatedTo, setDelegatedTo] = useState('');
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
      const res = await apiService.getCurrentDelegation();
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

  const hasMetamask = () => {
    return apiService.mode === Mode.ReadWrite;
  };

  return (
    <>
      <Typography variant="h2" component="h2" gutterBottom color="textPrimary">
        ガーディアンリスト
      </Typography>

      <Explanations />

      {/* <Typography align="right" variant="overline">
        Total stake: {totalStake} Orbs
      </Typography> */}

      <Typography variant="subtitle1" gutterBottom color="textPrimary">
        次回投票日はEthereum Block X時:{' '}
        <Link
          variant="h6"
          color="secondary"
          target="_blank"
          rel="noopener"
          href={`https://etherscan.io/block/countdown/${nextElectionsBlockHeight}`}
        >
          {nextElectionsBlockHeight}
        </Link>
      </Typography>

      <GuardiansList
        delegatedTo={delegatedTo}
        enableDelegation={hasMetamask()}
        guardians={guardians}
        onSelect={delegate}
      />

      {hasMetamask() && delegatedTo.length > 0 && (
        <Typography paragraph variant="body1" color="textPrimary">
          投票状況: 投票先 `{delegatedTo}`.
        </Typography>
      )}
    </>
  );
};

export default DelegatorsPage;
