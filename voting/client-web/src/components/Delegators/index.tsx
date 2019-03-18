import React, { useState, useEffect } from 'react';
import GuardiansList from './list';
import Link from '@material-ui/core/Link';
import { Mode } from '../../api/interface';
import GuardianDialog from '../GuardianDetails';
import Typography from '@material-ui/core/Typography';
import ManualDelegationDialog from '../ManualDelegation';

const DelegatorsPage = ({ apiService }) => {
  const [guardians, setGuardians] = useState({} as {
    [address: string]: { name: string; url: string };
  });
  const [selectedGuardian, setSelectedGuardian] = useState('');
  const [guardianDetailsDialogState, setGuardianDetailsDialogState] = useState(
    false
  );
  const [
    manualDelegationDialogState,
    setManualDelegationDialogState
  ] = useState(false);

  const [totalStake, setTotalStake] = useState('0');

  const fetchTotalStake = async () => {
    const totalStake = await apiService.getTotalStake();
    setTotalStake(totalStake);
  };

  const fetchGuardians = async () => {
    const addresses = await apiService.getGuardians();
    const details = await Promise.all(
      addresses.map(address => apiService.getGuardianData(address))
    );

    const guardiansStateObject = addresses.reduce((acc, curr, idx) => {
      acc[curr] = {
        name: details[idx]['name'],
        url: details[idx]['website'],
        stake: details[idx]['stake']
      };
      return acc;
    }, {});
    setGuardians(guardiansStateObject);
  };

  useEffect(() => {
    fetchTotalStake();
    fetchGuardians();
  }, []);

  const delegate = async candidate => {
    const receipt = await apiService.delegate(candidate);
    console.log(receipt);
  };

  const delegateHandler = () => {
    delegate(selectedGuardian);
    setTimeout(() => {
      setGuardianDetailsDialogState(false);
    }, 100);
  };

  const manualDelegateHandler = address => {
    delegate(address);
    setTimeout(() => {
      setManualDelegationDialogState(false);
    }, 100);
  };

  const selectGuardian = address => {
    setSelectedGuardian(address);
    setGuardianDetailsDialogState(true);
  };

  const hasMetamask = () => {
    return apiService.mode === Mode.ReadWrite;
  };

  return (
    <>
      <Typography variant="h2" component="h2" gutterBottom color="textPrimary">
        Guardians List
      </Typography>

      <Typography align="right" variant="overline">
        Total stake: {totalStake} Orbs
      </Typography>

      <GuardiansList guardians={guardians} onSelect={selectGuardian} />

      {hasMetamask() && (
        <Typography paragraph variant="body1" color="textPrimary">
          Want to delegate manually to another address? Click{' '}
          <Link
            variant="h6"
            color="secondary"
            data-testid="open-manual-delegation-dialog"
            onClick={() => setManualDelegationDialogState(true)}
          >
            here
          </Link>
          .
        </Typography>
      )}

      <Typography paragraph variant="body1" color="textPrimary">
        Delegation Status: Your vote is going to `0x`
      </Typography>

      <GuardianDialog
        readOnly={!hasMetamask()}
        dialogState={guardianDetailsDialogState}
        guardian={Object.assign(
          { address: selectGuardian },
          guardians[selectedGuardian]
        )}
        onClose={() => setGuardianDetailsDialogState(false)}
        onDelegate={delegateHandler}
      />

      <ManualDelegationDialog
        dialogState={manualDelegationDialogState}
        onClose={() => setManualDelegationDialogState(false)}
        onDelegate={manualDelegateHandler}
      />
    </>
  );
};

export default DelegatorsPage;
