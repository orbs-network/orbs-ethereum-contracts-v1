/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import styles from './styles';
import ValidatorsList from './list';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import { Mode } from '../../api/interface';
import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { get, save } from '../../services/vote-storage';
import { normalizeUrl } from '../../services/urls';
import { Link } from 'react-router-dom';
import { ApiService } from '../../api';

const ReadOnlyVoteButton = () => {
  return (
    <Tooltip title="Install Metamask extension to have access to voting capabilities">
      <div>
        <Button
          data-testid="vote-button"
          variant="outlined"
          color="secondary"
          disabled={true}
        >
          Vote Out
        </Button>
      </div>
    </Tooltip>
  );
};

const VoteButton = ({ onVote, disabled }) => {
  return (
    <Button
      data-testid="vote-button"
      onClick={onVote}
      variant="outlined"
      color="secondary"
      disabled={disabled}
    >
      Vote Out
    </Button>
  );
};

const LeaveEveryoneButton = ({ onVote, disabled }) => {
  return (
    <Button
      data-testid="leave-everyone-button"
      style={{ marginRight: 15 }}
      variant="outlined"
      color="secondary"
      onClick={onVote}
      disabled={disabled}
    >
      Keep everyone
    </Button>
  );
};

const GuardianPage = ({
  classes,
  apiService
}: {
  classes: any;
  apiService: ApiService;
}) => {
  const [validators, setValidators] = useState({} as {
    [address: string]: {
      checked: boolean;
      name: string;
      url: string;
      orbsAddress: string;
      votesAgainst: string;
    };
  });

  const [lastVote, setLastVote] = useState([]);
  const [selectionDisabled, setSelectionDisabled] = useState(false);

  const fetchValidator = async (address, checked) => {
    const data = await apiService.getValidatorData(address);
    validators[address] = {
      checked,
      name: data['name'],
      url: normalizeUrl(data['website']),
      orbsAddress: data['orbsAddress'],
      votesAgainst: data['votesAgainst']
    };
    setValidators(Object.assign({}, validators));
  };

  const fetchValidators = async () => {
    const validatorsInState = await apiService.getValidators();

    if (hasMetamask() && isMetamaskActive()) {
      const from = await apiService.getCurrentAddress();
      const validatorsInStorage = get(from);
      validatorsInState.forEach(address => {
        fetchValidator(address, validatorsInStorage.indexOf(address) > -1);
      });
    } else {
      validatorsInState.forEach(address => fetchValidator(address, false));
    }
  };

  const fetchLastVote = async () => {
    try {
      if (hasMetamask()) {
        const { validators } = await apiService.getLastVote();
        setLastVote(validators);
      }
    } catch (err) {
      console.warn('Guardian did not vote before');
    }
  };

  const commitVote = async () => {
    const from = await apiService.getCurrentAddress();
    const stagedValidators = Object.keys(validators).filter(
      address => validators[address].checked
    );
    const receipt = await apiService.voteOut(stagedValidators);
    save(from, stagedValidators);
    fetchLastVote();
    console.log(receipt);
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

  const hasMetamask = () => apiService.mode === Mode.ReadWrite;
  const isMetamaskActive = () => ethereum._metamask.isEnabled();

  const hasSomebodySelected = () =>
    Object.keys(validators).some(address => validators[address].checked);

  useEffect(() => {
    fetchValidators();
    fetchLastVote();
  }, []);

  return (
    <>
      <Typography variant="h2" component="h2" gutterBottom color="textPrimary">
        Validators List
      </Typography>

      {hasMetamask() && (
        <Link to="/guardian/new">
          <Typography variant="overline" color="textSecondary">
            Become a guardian
          </Typography>
        </Link>
      )}

      <ValidatorsList
        disableAll={selectionDisabled}
        readOnly={!hasMetamask()}
        validators={validators}
        onToggle={address => toggleCheck(address)}
      />
      <div className={classes.voteButton}>
        {hasMetamask() ? (
          <>
            <LeaveEveryoneButton
              onVote={commitVote}
              disabled={
                hasSomebodySelected() || Object.keys(validators).length === 0
              }
            />
            <VoteButton onVote={commitVote} disabled={!hasSomebodySelected()} />
          </>
        ) : (
          <ReadOnlyVoteButton />
        )}
      </div>

      {hasMetamask() && lastVote.length > 0 ? (
        <Typography variant="body1" color="textPrimary">
          Your most recent vote was against:
          {lastVote.map(address => (
            <Typography
              style={{ lineHeight: 1.7 }}
              variant="overline"
              key={address}
              color="textSecondary"
            >
              {address}
            </Typography>
          ))}
        </Typography>
      ) : (
        <Typography variant="body1" color="textPrimary">
          You have not voted yet
        </Typography>
      )}
    </>
  );
};

export default withStyles(styles)(GuardianPage);
