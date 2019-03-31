// Copyright 2019 the orbs-ethereum-contracts authors
// This file is part of the orbs-ethereum-contracts library in the Orbs project.
//
// This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
// The above notice should be included in all copies or substantial portions of the software.

package test

import (
	"github.com/stretchr/testify/require"
	"testing"
	"time"
)

func TestTransactionsFailWhenSubscriptionIsInvalid(t *testing.T) {
	orbs := newGamma()
	ethereum := newTruffle()

	require.NoError(t, orbs.sendATransaction(), "failed sending a transaction before refreshing subscription")

	subscriptionManagerAddress, err := ethereum.deploySubscriptionManager()
	require.NoError(t, err)

	ethereum.WaitForBlock(10)
	time.Sleep(2 * time.Second)

	require.NoError(t, orbs.refreshSubscription(subscriptionManagerAddress), "failed refreshing subscription")

	require.Error(t, orbs.sendATransaction(), "succeeded sending a transaction after refreshing subscription")

}

