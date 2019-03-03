import React, { useState, useEffect } from 'react';

const StakeholderPage = ({
  guardiansContract,
  votingContract,
  metamaskService
}) => {
  const from = metamaskService.getCurrentAddress();

  const [candidate, setCandidate] = useState('');
  const [guardians, setGuardians] = useState({} as {
    [address: string]: { name: string; url: string };
  });

  const fetchGuardians = async () => {
    const addresses = await guardiansContract.methods
      .getGuardians()
      .call({ from });
    const details = await Promise.all(
      addresses.map(address =>
        guardiansContract.methods.getGuardianData(address).call({ from })
      )
    );
    setGuardians(
      addresses.reduce((acc, curr, idx) => {
        acc[curr] = {
          name: details[idx]['_name'],
          url: details[idx]['_website']
        };
        return acc;
      }, {})
    );
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
        <dl>
          {Object.keys(guardians) &&
            Object.keys(guardians).map(address => (
              <dt key={address}>
                <input
                  type="radio"
                  name="candidate"
                  value={address}
                  onChange={ev => setCandidate(ev.target.value)}
                />
                <a
                  href={guardians[address].url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {guardians[address].name}
                </a>
              </dt>
            ))}
        </dl>
        <button onClick={delegate}>Delegate</button>
      </div>
    </>
  );
};

export default StakeholderPage;
