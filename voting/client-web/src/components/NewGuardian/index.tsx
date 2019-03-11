import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Typography, FormControl, TextField, Button } from '@material-ui/core';

const styles = () => ({
  add: {
    marginTop: 20,
    width: 80
  },
  form: {
    width: 400
  }
});

const NewGuardian = ({ classes, metamaskService, guardiansContract }) => {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');

  const isAddDisabled = () => !(name.length > 0 && website.length > 0);

  const addGuardian = async () => {
    const from = await metamaskService.enable();
    guardiansContract.methods.register(name, website).send({ from });
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
