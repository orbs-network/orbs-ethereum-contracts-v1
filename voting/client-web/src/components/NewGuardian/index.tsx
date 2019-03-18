import styles from './styles';
import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { FormControl, TextField, Button } from '@material-ui/core';

const NewGuardian = ({ classes, apiService }) => {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');

  const isAddDisabled = () => !(name.length > 0 && website.length > 0);

  const addGuardian = async () => {
    const receipt = await apiService.registerGuardian({ name, website });
    console.log(receipt);
  };

  return (
    <>
      <FormControl className={classes.form} variant="standard" margin="normal">
        <TextField
          required
          placeholder="Your name"
          value={name}
          onChange={ev => setName(ev.target.value)}
          margin="normal"
          variant="standard"
        />
        <TextField
          required
          placeholder="Your website"
          value={website}
          onChange={ev => setWebsite(ev.target.value)}
          margin="normal"
          variant="standard"
        />
        <Button
          className={classes.add}
          variant="outlined"
          color="secondary"
          onClick={addGuardian}
          disabled={isAddDisabled()}
        >
          Add
        </Button>
      </FormControl>
    </>
  );
};

export default withStyles(styles)(NewGuardian);
