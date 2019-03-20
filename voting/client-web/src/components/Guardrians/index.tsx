import styles from './styles';
import ValidatorsList from './list';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import { Mode } from '../../api/interface';
import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { get, save } from '../../services/vote-storage';
import { Link } from 'react-router-dom';

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

const GuardianPage = ({ classes, apiService }) => {
  const [validators, setValidators] = useState({} as {
    [address: string]: {
      checked: boolean;
      name: string;
      url: string;
      orbsAddress: string;
    };
  });

  const [lastVote, setLastVote] = useState([]);

  const fetchValidators = async () => {
    const validatorsInState = await apiService.getValidators();

    const validatorsInfo = await Promise.all(
      validatorsInState.map(address => apiService.getValidatorData(address))
    );

    const resultValidators = validatorsInState.reduce(
      (acc, currAddress, idx) => {
        acc[currAddress] = {
          checked: false,
          name: validatorsInfo[idx]['name'],
          url: validatorsInfo[idx]['website'],
          orbsAddress: validatorsInfo[idx]['orbsAddress'],
          votesAgainst: validatorsInfo[idx]['votesAgainst']
        };
        return acc;
      },
      {}
    );

    if (hasMetamask()) {
      const from = await apiService.getCurrentAddress();
      const validatorsInStorage = get(from);

      validatorsInStorage.forEach(address => {
        if (resultValidators[address] !== undefined) {
          resultValidators[address].checked = true;
        }
      });
    }

    setValidators(resultValidators);
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

  const toggleCheck = (address: string) => {
    validators[address].checked = !validators[address].checked;
    setValidators(Object.assign({}, validators));
  };

  const hasMetamask = () => apiService.mode === Mode.ReadWrite;

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
