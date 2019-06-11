/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import React from 'react';
import Typography from '@material-ui/core/Typography';

export default () => (
  <>
    <Typography paragraph variant='h6' color='textPrimary'>
      Acting as a Guardian requires continuous monitoring and participation in the Orbs network. Delegators Token
      holders may choose to participate as Guardians or select a Guardian to empower with their voting weight.
      Delegating the voting weight to an active Guardian increases the network’s security by enabling the weight of the
      honest, silent majority to impact the network. The voting weight of each Delegator is equal to the balance of
      their ORBS tokens at the time of each election. In order to participate as a Delegator, a token holder must have
      at least 10,000 ORBS tokens in its balance at the time of the election event.
    </Typography>
    <Typography paragraph variant='h6' color='textPrimary'>
      It is important for a Delegator to select an active Guardian, as the participation of the Guardian is required in
      order for the Delegator to participate and receive rewards. Moreover, Delegators are encouraged to delegate only
      to identified and reputable Guardians. A Delegator may trust another Delegator token holder with the selection of
      the Guardian, allowing the Guardian to receive the voting weight of the hierarchy of all Delegators behind it. A
      delegation may be modified at any time and persists unless modifiedotherwise remains as is.
    </Typography>
  </>
);
