# Guardians Service
A services that provides a simple way to with Guardians.


### `readSelectedGuardianAddress(address: string): Promise<string>`

Get to whom the given `address` is currently delegating. Returns the address of the Delegator or address `0x0000000000000000000000000000000000000000` if no delegation was found.

---

### `readDelegationInfo(address: string): Promise<IDelegationInfo>`

Get detailed information about the given `address` delegation.

**Note:** If no delegation was found, the `delegatedTo` will be `0x0000000000000000000000000000000000000000` and the `delegationBlockNumber` and `delegationTimestamp` fields will not exist in the result.

```ts
interface IDelegationInfo {
  delegatedTo: string;
  delegationType: "Not-Delegated" | "Transfer" | "Delegate";
  delegatorBalance: number;
  delegationBlockNumber?: number;
  delegationTimestamp?: number;
}
```

---

### `readGuardiansList(offset: number, limit: number): Promise<string[]>`

Get a list of Guardians addresses, using `offset` and `limit` for pagination.

---

### `readGuardianInfo(guardianAddress: string): Promise<IGuardianInfo>`

Get information about the given Guardian.

```ts
interface IGuardianInfo {
  name: string;
  website: string;
  hasEligibleVote: boolean;
  currentVote: string[];
  voted: boolean;
  stake: number;
}
```
