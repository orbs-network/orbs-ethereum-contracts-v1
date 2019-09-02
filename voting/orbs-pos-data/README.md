# Orbs POS Data
A library that provides a simple way to read data about the Orbs POS, like Guardians, rewards, etc.

## Installation
`npm install orbs-pos-data --save`

## Setup

```js
import { orbsPOSDataServiceFactory } from 'orbs-pos-data';

const ethereumProviderUrl = 'https://mainnet.infura.io/v3/YOUR_KEY';	// The Ethereum that we will query
const orbsNodeAddress = '18.197.127.2';	// The Orbs node that we will query
const virtualChainId = 1100000;	// The virtual chain ID on the Orbs network

const orbsPosData = orbsPOSDataServiceFactory(ethereumProviderUrl, orbsNodeAddress, virtualChainId);
```


## Usage

### `getValidators(): Promise<string[]>`

Get a list of Orb's Validators addresses.

---

### `getValidatorInfo(validatorAddress: string): Promise<IValidatorInfo>`

Get detailed information about the given Validator.

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

### `getTotalParticipatingTokens(): Promise<number>`

Get the current total number of participating ORBS in the POS.

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

Get a list of Guardians addresses, using `offset` and `limit` for pagination.

---

### `getGuardianInfo(guardianAddress: string): Promise<IGuardianInfo>`

Get information about the given Guardian.

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

### `getUpcomingElectionBlockNumber(): Promise<number>`

Get the upcoming election block number (on Ethereum)

---

### `getEffectiveElectionBlockNumber(): Promise<number>`

Get the effective election block number (on Ethereum)

---

### `getDelegatee(address: string): Promise<string>`

Get to whom the given `address` is currently delegating. Returns the address of the Delegator or address `0x0000000000000000000000000000000000000000` if no delegation was found.

---

### `getDelegationInfo(address: string): Promise<IDelegationInfo>`

Get detailed information about the given `address` delegation.

**Note:** If no delegation was found, the `delegatedTo` will be `0x0000000000000000000000000000000000000000` and the `delegationBlockNumber` and `delegationTimestamp` fields will not exist in the result.

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

Get a list of the currently elected Validator's addresses.

---

### `getElectedValidatorInfo(validatorAddress: string): Promise<IElectedValidatorInfo>`

Get a detailed information about the given Validator.

---

### Open issues
The library is available both on NodeJs and on the browser, **but** on the browser the library weights more than 7Mb. We will address this soon.
