import React, { useState, useEffect } from 'react';
import GuardiansList from './list';
import { Mode } from '../../api/interface';
import GuardianDialog from '../GuardianDetails';
import Typography from '@material-ui/core/Typography';
import { ApiService } from '../../api';

const DelegatorsPage = ({ apiService }: { apiService: ApiService }) => {
  const [guardians, setGuardians] = useState({} as {
    [address: string]: { name: string; url: string };
  });
  const [selectedGuardian, setSelectedGuardian] = useState('');
  const [guardianDetailsDialogState, setGuardianDetailsDialogState] = useState(
    false
  );

  const [totalStake, setTotalStake] = useState('0');
  const [delegatedTo, setDelegatedTo] = useState('');

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

  const fetchDelegatedTo = async () => {
    if (hasMetamask()) {
      const res = await apiService.getCurrentDelegation();
      setDelegatedTo(res);
    }
  };

  useEffect(() => {
    fetchTotalStake();
    fetchGuardians();
    fetchDelegatedTo();
  }, []);

  const delegate = async candidate => {
    const receipt = await apiService.delegate(candidate);
    fetchDelegatedTo();
    console.log(receipt);
  };

  const delegateHandler = () => {
    delegate(selectedGuardian);
    setTimeout(() => {
      setGuardianDetailsDialogState(false);
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
        ガーディアンリスト
      </Typography>

      <Typography align="right" variant="overline">
        合計ステーク: {totalStake} Orbs
      </Typography>

      <GuardiansList guardians={guardians} onSelect={selectGuardian} />

      {hasMetamask() && delegatedTo.length > 0 ? (
        <Typography paragraph variant="body1" color="textPrimary">
          投票状況: Your vote is going to `{delegatedTo}`.
        </Typography>
      ) : (
        <Typography paragraph variant="body1" color="textPrimary">
          投票状況: まだ投票が完了していません.
        </Typography>
      )}

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
    </>
  );
};

export default DelegatorsPage;
