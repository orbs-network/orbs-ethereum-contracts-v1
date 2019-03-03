import React, { useEffect, useState } from 'react';
import { get, save } from '../../services/vote-storage';

const GuardianPage = ({
  validatorsContract,
  votingContract,
  metamaskService
}) => {
  const [validators, setValidators] = useState({});
  const [proposedValidator, setProposedValidator] = useState('');

  const from = metamaskService.getCurrentAddress();

  const fetchValidators = async () => {
    const validatorsInState = await validatorsContract.methods
      .getValidators()
      .call({ from });

    const validatorsInStorage = get();
    const resultValidators = {};
    validatorsInState.forEach(address => (resultValidators[address] = false));
    validatorsInStorage.forEach(address => (resultValidators[address] = true));
    setValidators(resultValidators);
  };

  const addValidator = () => {
    validatorsContract.methods
      .addValidator(proposedValidator)
      .send({ from })
      .then(() => setProposedValidator(''));
  };

  const commitVote = async () => {
    const stagedValidators = Object.keys(validators).filter(
      address => validators[address]
    );
    await votingContract.methods.vote(stagedValidators).send({ from });
    save(stagedValidators);
  };

  const toggleCheck = (address: string) => {
    validators[address] = !validators[address];
  };

  useEffect(() => {
    fetchValidators();
  }, []);

  return (
    <>
      <h3>Hello Guardian, {from}</h3>
      <ul>
        {Object.keys(validators) &&
          Object.keys(validators).map(address => (
            <li key={address}>
              <input
                type="checkbox"
                value={address}
                defaultChecked={validators[address]}
                onChange={() => toggleCheck(address)}
              />
              <span>{address}</span>
            </li>
          ))}
      </ul>
      <div>
        <input
          type="text"
          placeholder="Enter validator address"
          value={proposedValidator}
          onChange={ev => setProposedValidator(ev.target.value)}
        />
        <button onClick={addValidator}>Add</button>
        <button onClick={commitVote}>Vote</button>
      </div>
    </>
  );
};

export default GuardianPage;
