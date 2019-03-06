import Link from '@material-ui/core/Link';
import Button from '@material-ui/core/Button';
import React, { useState, useEffect } from 'react';
import { withStyles } from '@material-ui/core/styles';
import {
  Typography,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel
} from '@material-ui/core';
import { compileFunction } from 'vm';

const styles = () => ({
  container: {
    padding: '15px'
  }
});

const StakeholderPage = ({
  guardiansContract,
  votingContract,
  metamaskService,
  classes
}) => {
  const from = metamaskService.getCurrentAddress();

  const [candidate, setCandidate] = useState('');
  const [guardians, setGuardians] = useState({} as {
    [address: string]: { name: string; url: string };
  });

  const fetchGuardians = async () => {
    const addresses = await guardiansContract.methods
      .getGuardians(0, 100)
      .call({ from });
    const details = await Promise.all(
      addresses.map(address =>
        guardiansContract.methods.getGuardianData(address).call({ from })
      )
    );
    const guardiansStateObject = addresses.reduce((acc, curr, idx) => {
      acc[curr] = {
        name: details[idx]['name'],
        url: details[idx]['website']
      };
      return acc;
    }, {});
    setGuardians(guardiansStateObject);
  };

  useEffect(() => {
    fetchGuardians();
  }, []);

  const delegate = () => {
    votingContract.methods.delegate(candidate).send({ from });
  };

  return (
    <div className={classes.container}>
      <Typography variant="h6" color="textPrimary" noWrap>
        Here you can delegate your vote to somebody else
      </Typography>
      <FormControl>
        <RadioGroup onChange={(_, val) => setCandidate(val)}>
          {Object.keys(guardians) &&
            Object.keys(guardians).map(address => (
              <FormControlLabel
                key={address}
                value={address}
                control={<Radio data-testid={`guardian-${address}-radio`} />}
                label={
                  <Link
                    data-testid={`guardian-${address}-label`}
                    href={guardians[address].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="secondary"
                    variant="body1"
                  >
                    {guardians[address].name}
                  </Link>
                }
              />
            ))}
        </RadioGroup>
        <Button
          data-testid={`delegate-button`}
          onClick={delegate}
          variant="outlined"
          color="secondary"
        >
          Delegate
        </Button>
      </FormControl>
    </div>
  );
};

export default withStyles(styles)(StakeholderPage);
