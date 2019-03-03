import React, { useEffect, useState } from 'react';
import { get, save } from '../../services/vote-storage';

const GuardianPage = ({
  validatorsContract,
  votingContract,
  metamaskService
}) => {
  const [validators, setValidators] = useState({} as {
    [address: string]: { checked: boolean; name: string; url: string };
  });
  const [proposedValidator, setProposedValidator] = useState('');

  const from = metamaskService.getCurrentAddress();

  const fetchValidators = async () => {
    const validatorsInState = await validatorsContract.methods
      .getValidators()
      .call({ from });

    const validatorsInfo = await Promise.all(
      validatorsInState.map(address =>
        validatorsContract.methods.getValidatorData(address).call({ from })
      )
    );

    const validatorsInStorage = get();

    const resultValidators = validatorsInState.reduce(
      (acc, currAddress, idx) => {
        acc[currAddress] = {
          checked: false,
          name: validatorsInfo[idx]['_name'],
          url: validatorsInfo[idx]['_website']
        };
        return acc;
      },
      {}
    );

    validatorsInStorage.forEach(address => {
      if (resultValidators[address] !== undefined) {
        resultValidators[address].checked = true;
      }
    });
    setValidators(resultValidators);
  };

  const addValidator = () => {
    validatorsContract.methods
      .addValidator(proposedValidator)
      .send({ from })
      .then(() => fetchValidators())
      .then(() => setProposedValidator(''));
  };

  const commitVote = async () => {
    const stagedValidators = Object.keys(validators).filter(
      address => validators[address].checked
    );
    await votingContract.methods.vote(stagedValidators).send({ from });
    save(stagedValidators);
  };

  const toggleCheck = (address: string) => {
    validators[address].checked = !validators[address].checked;
  };

  useEffect(() => {
    fetchValidators();
  }, []);

  return (
    <>
      <h3>Hello Guardian, {from}</h3>
      <dl>
        {Object.keys(validators) &&
          Object.keys(validators).map(address => (
            <dt key={address}>
              <input
                type="checkbox"
                value={address}
                defaultChecked={validators[address].checked}
                onChange={() => toggleCheck(address)}
              />
              <a
                href={validators[address].url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {validators[address].name}
              </a>
            </dt>
          ))}
      </dl>
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
