import React, { useEffect, useState } from 'react';

const GuardianPage = ({ validatorsContract, metamaskService }) => {
  const [validators, setValidators] = useState([]);
  const [candidateValidator, setCandidateValidator] = useState('');

  const from = metamaskService.getCurrentAddress();

  const fetchValidators = () => {
    validatorsContract.methods
      .getValidators()
      .call({ from })
      .then(setValidators);
  };

  const addValidator = () => {
    validatorsContract.methods
      .addValidator(candidateValidator)
      .send({ from })
      .then(() => setCandidateValidator(''));
  };

  useEffect(() => {
    fetchValidators();
  });

  return (
    <div>
      <h3>Hello Guardian, {from}</h3>
      <ul>
        {validators.map(validator => (
          <li key={validator}>{validator}</li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          placeholder="Enter validator address"
          value={candidateValidator}
          onChange={ev => setCandidateValidator(ev.target.value)}
        />
        <button onClick={addValidator}>Add</button>
      </div>
    </div>
  );
};

export default GuardianPage;
