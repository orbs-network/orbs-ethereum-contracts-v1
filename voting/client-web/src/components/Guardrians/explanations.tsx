import React from 'react';
import Typography from '@material-ui/core/Typography';

export default () => (
  <>
    <Typography paragraph variant="h6" color="textPrimary">
      Anyone who wishes to participate and contribute to the network’s security
      and ideal operation may register to be a Guardian. Registration is done
      using a smart contract on Ethereum, and enables Guardians to provide
      identification details, such as name and website, increasing trust by
      delegators and other stakeholders. A Guardian may update its registration
      details at any time.
    </Typography>
    <Typography paragraph variant="h6" color="textPrimary">
      Once registered, a Guardian may vote to elect the Validators. The vote for
      Validators may be cast at any time and is valid for up to a week. Guardian
      are expected to monitor the network and cast their votes accordingly, once
      the need arises. A Guardian is considered active for an election term as
      long as the Guardian vote is valid by the election event. The voting
      weight of each Guardian equals the sum of the ORBS tokens balance of each
      Delegator that delegated to them directly or hierarchically, including
      their own, at the time of each election.
    </Typography>
    <Typography paragraph variant="h6" color="textPrimary">
      Guardians are expected to actively monitormaintain active monitoring of
      the Orbs network and the operation of the Validators, and cast their votes
      to support and promote the best interests of the network. Guardians are
      encouraged to build a community of Delegators who empower them with their
      voting weight, thereby increasing the Guardian’s voting impact.
    </Typography>
  </>
);
