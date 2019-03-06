import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { get, save } from '../../services/vote-storage';
import {
  Typography,
  FormControl,
  FormGroup,
  Checkbox,
  FormControlLabel
} from '@material-ui/core';

const styles = () => ({
  container: {
    padding: '15px'
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

  const from = metamaskService.getCurrentAddress();

  const fetchValidators = async () => {
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

  const commitVote = async () => {
    const stagedValidators = Object.keys(validators).filter(
      address => validators[address].checked
    );
    await votingContract.methods.vote(stagedValidators).send({ from });
    save(stagedValidators);
  };

  const toggleCheck = (address: string) => {
    validators[address].checked = !validators[address].checked;
  };

  useEffect(() => {
    fetchValidators();
  }, []);

  return (
    <div className={classes.container}>
      <Typography variant="h6" color="textPrimary" noWrap>
        Here you can vote for a validators
      </Typography>
      <FormControl>
        <FormGroup>
          {Object.keys(validators) &&
            Object.keys(validators).map(address => (
              <FormControlLabel
                key={address}
                value={address}
                control={
                  <Checkbox
                    value={address}
                    defaultChecked={validators[address].checked}
                    onChange={() => toggleCheck(address)}
                  />
                }
                label={
                  <Link
                    href={validators[address].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="secondary"
                    variant="body1"
                  >
                    {validators[address].name}
                  </Link>
                }
              />
            ))}
        </FormGroup>
        <Button onClick={commitVote} variant="outlined" color="secondary">
          Vote
        </Button>
      </FormControl>
    </div>
  );
};

export default withStyles(styles)(GuardianPage);
