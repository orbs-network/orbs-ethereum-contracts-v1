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

