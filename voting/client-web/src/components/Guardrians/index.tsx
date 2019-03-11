import ValidatorsList from './list';
import { Link } from 'react-router-dom';
import Explanations from './explanations';
import Button from '@material-ui/core/Button';
import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { get, save } from '../../services/vote-storage';
import styles from './styles';

const GuardianPage = ({ classes, apiService }) => {
  const [validators, setValidators] = useState({} as {
    [address: string]: { checked: boolean; name: string; url: string };
  });

  const fetchValidators = async () => {
    const from = await apiService.getCurrentAddress();

    const validatorsInState = await apiService.getValidators();

    const validatorsInfo = await Promise.all(
      validatorsInState.map(address => apiService.getValidatorData(address))
    );

    const validatorsInStorage = get(from);

    const resultValidators = validatorsInState.reduce(
      (acc, currAddress, idx) => {
        acc[currAddress] = {
          checked: false,
          name: validatorsInfo[idx]['name'],
          url: validatorsInfo[idx]['website']
        };
        return acc;
      },
      {}
    );

    validatorsInStorage.forEach(address => {
      if (resultValidators[address] !== undefined) {
        resultValidators[address].checked = true;
      }
    });
    setValidators(resultValidators);
  };

  const commitVote = async () => {
    const from = await apiService.getCurrentAddress();
    const stagedValidators = Object.keys(validators).filter(
      address => validators[address].checked
    );
    const receipt = await apiService.voteOut(stagedValidators);
    save(from, stagedValidators);
    console.log(receipt);
  };

  const toggleCheck = (address: string) => {
    validators[address].checked = !validators[address].checked;
    setValidators(Object.assign({}, validators));
  };

  useEffect(() => {
    fetchValidators();
  }, []);

  return (
    <>
      <Explanations />
      <Link to="/validator/new">
        <Typography variant="subtitle1" color="textSecondary">
          Join as a Validator
        </Typography>
      </Link>
      <ValidatorsList
        validators={validators}
        onToggle={address => toggleCheck(address)}
      />
      <div className={classes.voteButton}>
        <Button
          data-testid="vote-button"
          onClick={commitVote}
          variant="outlined"
          color="secondary"
        >
          Vote Out
        </Button>
      </div>
    </>
  );
};

export default withStyles(styles)(GuardianPage);
