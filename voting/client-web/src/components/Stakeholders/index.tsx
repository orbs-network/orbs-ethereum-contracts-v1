import React, { useState, useEffect } from 'react';
import GuardiansList from './list';
import GuardianDialog from './dialog';
import { Link } from 'react-router-dom';
import Explanations from './explanations';
import { Mode } from '../../api/interface';
import Typography from '@material-ui/core/Typography';

const StakeholderPage = ({ apiService }) => {
  const [guardians, setGuardians] = useState({} as {
    [address: string]: { name: string; url: string };
  });
  const [selectedGuardian, setSelectedGuardian] = useState('');
  const [dialogState, setDialogState] = useState(false);

  const fetchGuardians = async () => {
    const addresses = await apiService.getGuardians();
    const details = await Promise.all(
      addresses.map(address => apiService.getGuardianData(address))
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

  const delegate = async candidate => {
    const receipt = await apiService.delegate(candidate);
    console.log(receipt);
  };

  const delegateHandler = () => {
    delegate(selectedGuardian);
    setTimeout(() => {
      setDialogState(false);
    }, 100);
  };

  const selectGuardian = address => {
    setSelectedGuardian(address);
    setDialogState(true);
  };

  const hasMetamask = () => {
    return apiService.mode === Mode.ReadWrite;
  };

  return (
    <>
      <Explanations />

      {hasMetamask() && (
        <Link to="/guardian/new">
          <Typography variant="subtitle1" color="textSecondary">
            Join as a Guardian
          </Typography>
        </Link>
      )}

      <GuardiansList guardians={guardians} onSelect={selectGuardian} />
      <GuardianDialog
        readOnly={!hasMetamask()}
        dialogState={dialogState}
        guardian={Object.assign(
          { address: selectGuardian },
          guardians[selectedGuardian]
        )}
        onClose={() => setDialogState(false)}
        onDelegate={delegateHandler}
      />
    </>
  );
};

export default StakeholderPage;
