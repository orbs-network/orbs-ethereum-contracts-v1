import ValidatorsList from './list';
import { Link } from 'react-router-dom';
import Explanations from './explanations';
import Button from '@material-ui/core/Button';
import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { get, save } from '../../services/vote-storage';

const styles = () => ({
  voteButton: {
    textAlign: 'center' as any,
    marginTop: 30
  }
});

const GuardianPage = ({
  validatorsContract,
  validatorsRegistryContract,
  votingContract,
  metamaskService,
  classes
}) => {
  const [validators, setValidators] = useState({} as {
    [address: string]: { checked: boolean; name: string; url: string };
  });

  const fetchValidators = async () => {
    const from = await metamaskService.enable();
    let validatorsInState = await validatorsContract.methods
      .getValidators()
      .call({ from });

    const validatorsInfo = await Promise.all(
      validatorsInState.map(address =>
        validatorsRegistryContract.methods
          .getValidatorData(address)
          .call({ from })
      )
    );

    const validatorsInStorage = get();

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

  const isVoteDisabled = () => {
    const stagedValidators = Object.keys(validators).filter(
      address => validators[address].checked
    );
    return stagedValidators.length === 0;
  };

  const commitVote = async () => {
    const from = await metamaskService.enable();
    const stagedValidators = Object.keys(validators).filter(
      address => validators[address].checked
    );
    const receipt = await votingContract.methods
      .vote(stagedValidators)
      .send({ from });
    save(stagedValidators);
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
          onClick={commitVote}
          variant="outlined"
          color="secondary"
          disabled={isVoteDisabled()}
        >
          Vote
        </Button>
      </div>
    </>
  );
};

export default withStyles(styles)(GuardianPage);
