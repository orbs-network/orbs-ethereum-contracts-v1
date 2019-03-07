import React, { useState, useEffect } from 'react';
import GuardiansList from './list';
import Explanations from './explanations';
import GuardianDialog from './dialog';

const StakeholderPage = ({
  guardiansContract,
  votingContract,
  metamaskService
}) => {
  const [guardians, setGuardians] = useState({} as {
    [address: string]: { name: string; url: string };
  });
  const [selectedGuardian, setSelectedGuardian] = useState('');
  const [dialogState, setDialogState] = useState(false);

  const fetchGuardians = async () => {
    const from = await metamaskService.enable();
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

  const delegate = async candidate => {
    const from = await metamaskService.enable();
    const receipt = await votingContract.methods
      .delegate(candidate)
      .send({ from });
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

  return (
    <>
      <Explanations />
      <GuardiansList guardians={guardians} onSelect={selectGuardian} />
      <GuardianDialog
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
