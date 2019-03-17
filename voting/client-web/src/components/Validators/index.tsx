import ValidatorsList from './list';
import { Mode } from '../../api/interface';
import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom';

const styles = () => ({});

const ValidatorsPage = ({ classes, apiService }) => {
  const [validators, setValidators] = useState({} as {
    [address: string]: { checked: boolean; name: string; url: string };
  });

  const fetchElectedValidators = async () => {};

  const hasMetamask = () => apiService.mode === Mode.ReadWrite;

  useEffect(() => {
    fetchElectedValidators();
  }, []);

  return (
    <>
      <Typography variant="h2" component="h2" gutterBottom color="textPrimary">
        Elected Validators
      </Typography>

      {hasMetamask() && (
        <Link to="/validator/new">
          <Typography variant="overline" color="textSecondary">
            Become a validator
          </Typography>
        </Link>
      )}

      <ValidatorsList validators={validators} />
    </>
  );
};

export default withStyles(styles)(ValidatorsPage);
