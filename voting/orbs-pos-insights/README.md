# Orbs POS Insights
A library that provides a simple way to read insights about the orbs POS, like guardians, rewards, etc.

## Installation
`npm install orbs-pos-insights --save`

## Setup

```js
import { orbsPOSInsightsServiceFactory } from 'orbs-pos-insights';

const ethereumProviderUrl = 'https://mainnet.infura.io/v3/YOUR_KEY';	// The Ethereum that we will query
const orbsNodeAddress = '18.197.127.2';	// The Orbs node that we will query
const virtualChainId = 1100000;	// The virtual chain Id on the Orbs network

const orbsPosInsights = orbsPOSInsightsServiceFactory(ethereumProviderUrl, orbsNodeAddress, virtualChainId);
```


## Usage

### `getValidators(): Promise<string[]>`

Get a list of Orb's validators addresses.

---

### `getValidatorInfo(address: string): Promise<IValidatorInfo>`

Get a detailed information about the given validator (`adderss` parameter)

```ts
interface IValidatorInfo {
  name: string;
  ipAddress: string;
  website: string;
  orbsAddress: string;
  votesAgainst: number;
}
```

---

### `getTotalStake(): Promise<number>`

Get the current total stake on the Orbs platform.

---

### `getRewards(address: string): Promise<IRewards>`

Get information about all the rewards of a given `address`.

```ts
export interface IRewards {
  delegatorReward: number;
  guardianReward: number;
  validatorReward: number;
}
```

---

### `getRewardsHistory(address: string): Promise<IRewardsDistributionEvent[]>`

Get a list of all the rewards distrebution events to a given `address`.

```ts
interface IRewardsDistributionEvent {
  distributionEvent: string;
  amount: number;
  transactionHash: string;
}
```

---

### `getGuardiansList(offset: number, limit: number): Promise<string[]>`

Get a list of guardians addresses, using `offset` and `limit` for pagination.

---

### `getGuardianInfo(address: string): Promise<IGuardianInfo>`

Get information about the given guardian (`address` parameter).

```ts
interface IGuardianInfo {
  name: string;
  website: string;
  hasEligibleVote: boolean;
  voted: boolean;
  stake: number;
}
```

---

### `getNextElectionsBlockHeight(): Promise<number>`

Get the next election block height (On Ethereum)

---

### `getPastElectionBlockHeight(): Promise<number>`

Get the previous election block height (On Ethereum)

---

### `getDelegationStatus(address: string): Promise<string>`

Get to whom of the given `address` is currently delegating to. Returns the address of the delegator or address `0x0000000000000000000000000000000000000000` if not delegation was found.

---

### `getDelegationInfo(address: string): Promise<IDelegationInfo>`

Get detailed information about the given `address` delegation.

**Note:** If no delegation was done, the `delegatedTo` will be `0x0000000000000000000000000000000000000000` and the `delegationBlockNumber` and `delegationTimestamp` fields will not exist in the result.

```ts
interface IDelegationInfo {
  delegatedTo: string;
  delegationType: "None-Delegated" | "Transfer" | "Delegate";
  delegatorBalance: number;
  delegationBlockNumber?: number;
  delegationTimestamp?: number;
}
```

---

### `getElectedValidators(): Promise<string[]>`

Get a list of the currently elected validator's addresses.

---

### `getElectedValidatorInfo(address: string): Promise<IElectedValidatorInfo>`

Get a detailed information about the given validator (`address` parameter) 

---

### Open issues
The library is available both on NodeJs and on the browser, **but** on the browser the library weights more than 7Mb. We will address this soon.