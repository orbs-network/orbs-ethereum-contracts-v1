import styles from './styles';
import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Typography, FormControl, TextField, Button } from '@material-ui/core';

const NewValidator = ({ classes, apiService }) => {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [orbsAddress, setOrbsAddress] = useState('');

  const isAddDisabled = () =>
    [name, website, ipAddress, orbsAddress].some(attr => !attr.length);

  const addValidator = async () => {
    const receipt = await apiService.registerValidator({
      name,
      ipAddress,
      website,
      orbsAddress
    });
    console.log(receipt);
  };

  return (
    <>
      <Typography paragraph variant="h6" color="textPrimary">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus gravida
        leo in mauris commodo pretium. Quisque varius tortor eget lorem
        scelerisque porta. Aenean dictum lectus quis magna gravida vestibulum.
        Integer eleifend dignissim facilisis. Nullam dapibus eleifend dolor, ac
        lacinia nisl rhoncus id. Aenean iaculis malesuada diam, sit amet cursus
        quam imperdiet non. Duis ullamcorper consectetur lectus a consequat.
        Pellentesque id pulvinar velit.
      </Typography>
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
        <TextField
          required
          placeholder="Your IP Address"
          value={ipAddress}
          onChange={ev => setIpAddress(ev.target.value)}
          margin="normal"
          variant="standard"
        />
        <TextField
          required
          placeholder="Your Orbs Address"
          value={orbsAddress}
          onChange={ev => setOrbsAddress(ev.target.value)}
          margin="normal"
          variant="standard"
        />
        <Button
          className={classes.add}
          variant="outlined"
          color="secondary"
          onClick={addValidator}
          disabled={isAddDisabled()}
        >
          Add
        </Button>
      </FormControl>
    </>
  );
};

export default withStyles(styles)(NewValidator);
