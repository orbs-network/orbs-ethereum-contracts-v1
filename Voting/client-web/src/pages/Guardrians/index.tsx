import React, { useEffect, useState } from 'react';

const GuardianPage = ({ validatorsContract }) => {
  const [validators, setValidators] = useState([]);
  const [candidateValidator, setCandidateValidator] = useState('');

  const fetchValidators = () => {
    validatorsContract.methods
      .getValidators()
      .call({
        from: ethereum.selectedAddress
      })
      .then(res => {
        setValidators(res);
      });
  };

  const addValidator = () => {
    validatorsContract.methods
      .addValidator(candidateValidator)
      .send({
        from: ethereum.selectedAddress
      })
      .then(
        res => {
          console.log(res);
          fetchValidators();
        },
        err => {
          console.log(err);
        }
      );
  };

  useEffect(() => {
    if (validatorsContract.methods) {
      fetchValidators();
    }
  });

  const address = ethereum.selectedAddress;

  return (
    <div>
      <h3>Hello Guardian, {address}</h3>
      <ul>
        {validators.map(validator => (
          <li key={validator}>{validator}</li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          placeholder="Enter validator address"
          onChange={ev => setCandidateValidator(ev.target.value)}
        />
        <button onClick={addValidator}>Add</button>
      </div>
    </div>
  );
};

export default GuardianPage;
