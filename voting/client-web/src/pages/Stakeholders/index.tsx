import React, { useState, useEffect } from 'react';

const StakeholderPage = ({
  guardiansContract,
  votingContract,
  metamaskService
}) => {
  const from = metamaskService.getCurrentAddress();

  const [candidate, setCandidate] = useState('');
  const [guardians, setGuardians] = useState([]);

  const fetchGuardians = () => {
    guardiansContract.methods
      .getGuardians()
      .call({ from })
      .then(setGuardians);
  };

  useEffect(() => {
    fetchGuardians();
  }, []);

  const delegate = () => {
    votingContract.methods.delegate(candidate).send({ from });
  };

  return (
    <>
      <h3>Hello Stakeholder, {from}</h3>
      <div>
        <ul>
          {guardians &&
            guardians.map(g => (
              <li key={g}>
                <input
                  type="radio"
                  name="candidate"
                  value={g}
                  onChange={ev => setCandidate(ev.target.value)}
                />
                <span>{g}</span>
              </li>
            ))}
        </ul>
        <button onClick={delegate}>Delegate</button>
      </div>
    </>
  );
};

export default StakeholderPage;
