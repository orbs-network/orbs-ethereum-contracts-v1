/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useApi } from '../../services/ApiContext';
import { normalizeUrl } from '../../services/urls';
import { get, save } from '../../services/vote-storage';
import { GuardiansPageStyles } from './GuardiansPage.styles';
import { ValidatorsList } from './ValidatorsList';

const ReadOnlyVoteButton = () => {
  const { t } = useTranslation();
  return (
    <Tooltip title='Install Metamask extension to have access to voting capabilities'>
      <div>
        <Button data-testid='vote-button' variant='outlined' color='secondary' disabled={true}>
          {t('Vote Out')}
        </Button>
      </div>
    </Tooltip>
  );
};

const VoteButton = ({ onVote, disabled }) => {
  const { t } = useTranslation();
  return (
    <Button data-testid='vote-button' onClick={onVote} variant='outlined' color='secondary' disabled={disabled}>
      {t('Vote Out')}
    </Button>
  );
};

const LeaveEveryoneButton = ({ onVote, disabled }) => {
  const { t } = useTranslation();
  return (
    <Button
      data-testid='leave-everyone-button'
      style={{ marginRight: 15 }}
      variant='outlined'
      color='secondary'
      onClick={onVote}
      disabled={disabled}
    >
      {t('Keep everyone')}
    </Button>
  );
};

const GuardiansPageImpl = ({ classes }: { classes: any }) => {
  const { remoteService, metamask } = useApi();
  const [validators, setValidators] = useState({} as {
    [address: string]: {
      checked: boolean;
      name: string;
      url: string;
      orbsAddress: string;
      votesAgainst: string;
    };
  });

  const [lastVote, setLastVote] = useState<string[]>([]);
  const [selectionDisabled, setSelectionDisabled] = useState(false);

  const fetchValidator = async (address, checked) => {
    const data = await remoteService.getValidatorData(address);
    validators[address] = {
      checked,
      name: data['name'],
      url: normalizeUrl(data['website']),
      orbsAddress: data['orbsAddress'],
      votesAgainst: data['votesAgainst'],
    };
    setValidators(Object.assign({}, validators));
  };

  const fetchValidators = async () => {
    const validatorsInState = await remoteService.getValidators();

    if (metamask && isMetamaskActive()) {
      const from = await metamask.getCurrentAddress();
      const validatorsInStorage = get(from);
      validatorsInState.forEach(address => {
        fetchValidator(address, validatorsInStorage.indexOf(address) > -1);
      });
    } else {
      validatorsInState.forEach(address => fetchValidator(address, false));
    }
  };

  const { t } = useTranslation();

  const fetchLastVote = async () => {
    try {
      if (metamask) {
        const { validators } = await metamask.getLastVote();
        setLastVote(validators);
      }
    } catch (err) {
      console.warn(t('Guardian did not vote before'));
    }
  };

  const commitVote = async () => {
    if (metamask) {
      const from = await metamask.getCurrentAddress();
      const stagedValidators = Object.keys(validators).filter(address => validators[address].checked);
      const receipt = await metamask.voteOut(stagedValidators);
      save(from, stagedValidators);
      fetchLastVote();
    }
  };

  const validateVoteOutAmount = (validators): boolean => {
    const checkedAmount = Object.keys(validators).reduce((acc, key) => {
      acc += Number(validators[key].checked);
      return acc;
    }, 0);
    if (checkedAmount === 3) {
      setSelectionDisabled(true);
      return false;
    } else {
      setSelectionDisabled(false);
      return true;
    }
  };

  const toggleCheck = (address: string) => {
    const update = Object.assign({}, validators);
    update[address].checked = !update[address].checked;
    if (validateVoteOutAmount(update)) {
      setValidators(update);
    }
  };

  const isMetamaskActive = () => window.ethereum._metamask.isEnabled();

  const hasSomebodySelected = () => Object.keys(validators).some(address => validators[address].checked);

  useEffect(() => {
    fetchValidators();
    fetchLastVote();
  }, []);

  return (
    <>
      <Typography variant='h2' component='h2' gutterBottom color='textPrimary'>
        {t('Validators List')}
      </Typography>

      {metamask && (
        <Link to='/guardian/new'>
          <Typography variant='overline' color='textSecondary'>
            {t('Become a guardian')}
          </Typography>
        </Link>
      )}

      <ValidatorsList
        disableAll={selectionDisabled}
        readOnly={!metamask}
        validators={validators}
        onToggle={address => toggleCheck(address)}
      />
      <div className={classes.voteButton}>
        {metamask ? (
          <>
            <LeaveEveryoneButton
              onVote={commitVote}
              disabled={hasSomebodySelected() || Object.keys(validators).length === 0}
            />
            <VoteButton onVote={commitVote} disabled={!hasSomebodySelected()} />
          </>
        ) : (
          <ReadOnlyVoteButton />
        )}
      </div>

      {metamask && lastVote.length > 0 ? (
        <Typography variant='body1' color='textPrimary'>
          {t('Your most recent vote was against')}
          {':'}
          {lastVote.map(address => (
            <Typography style={{ lineHeight: 1.7 }} variant='overline' key={address} color='textSecondary'>
              {address}
            </Typography>
          ))}
        </Typography>
      ) : (
        <Typography variant='body1' color='textPrimary'>
          {t('You have not voted yet')}
        </Typography>
      )}
    </>
  );
};

export const GuardiansPage = withStyles(GuardiansPageStyles)(GuardiansPageImpl);
