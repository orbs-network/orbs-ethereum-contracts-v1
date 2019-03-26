# Orbs Subscription Contract

## Testing on Ropsten
1. Deploy `TestingERC20` (Orbs Token) token to Ropsten
1. Deploy `OrbsSubscription` to Ropsten, passing the address of `TestingERC20`. You can ignore the validators contract address for testing purposes (second constructor argument).
1. Fund a subscriber address with enough Orbs tokens (15000000000000000000000)
1. `approve` the `OrbsSubscription` to pull enough `TestingERC20` tokens from subscriber address with a big enough limit (`MAX_UINT - 1`), or at least 15000000000000000000000. 
1. Provision a virtual chain on a testnet connected to Ropsten
1. Verify that it closes blocks
1. Call `GlobalPreOrder.refreshSubscription` on your virtual chain, passing the address of `OrbsSubscription`. You can use the [Gamma CLI json](subscription/test/gammacli-jsons/refresh-subscription.json).
1. See that you fail to send a transaction. You can use this [Gamma CLI json](subscription/test/gammacli-jsons/generic-transaction.json) under consensus (`send-tx`) for that purpose.
1. Pay the subscription.
1. Wait for finality period to pass.
1. Call `GlobalPreOrder.refreshSubscription` again.
1. Send the transaction again and see that it works.

## Testing on Mainnet
1. Fund a subscriber address with enough Orbs tokens
1. `approve` the `OrbsSubscription` to pull enough `OrbsToken` tokens from subscriber address with a big enough limit
1. Provision a virtual chain on mainnet
1. Verify that it closes blocks
1. Call `GlobalPreOrder.refreshSubscription` on your virtual chain, passing the address of `OrbsSubscription`. You can use the [Gamma CLI json](subscription/test/gammacli-jsons/refresh-subscription.json).
1. See that you fail to send a transaction. You can use this [Gamma CLI json](subscription/test/gammacli-jsons/generic-transaction.json) under consensus (`send-tx`) for that purpose.
1. Pay the subscription.
1. Wait for finality period to pass.
1. Call `GlobalPreOrder.refreshSubscription` again.
1. Send the transaction again and see that it works.

## Automatic refreshing
TBD
