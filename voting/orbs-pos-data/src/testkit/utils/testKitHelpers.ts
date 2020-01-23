import { TUnsubscribeFunction } from '../../services/contractsTypes/contractTypes';

/**
 * Ensures that the inner map exists with the given outer map key (creates a new map if not) and return the inner map.
 */
export function ensureAndGetInnerMap<OUTER_MAP_KEY, INNER_MAP_KEY, INNER_MAP_VALUE>(
  complexMap: Map<OUTER_MAP_KEY, Map<INNER_MAP_KEY, INNER_MAP_VALUE>>,
  firstLevelKey: OUTER_MAP_KEY,
): Map<INNER_MAP_KEY, INNER_MAP_VALUE> {
  // Ensure inner map exists
  if (!complexMap.has(firstLevelKey)) {
    complexMap.set(firstLevelKey, new Map<INNER_MAP_KEY, INNER_MAP_VALUE>());
  }

  return complexMap.get(firstLevelKey);
}

/**
 * Sets the given value in the map with a unique id, and returns an "async" function that removes the value from the map.
 */
export function setValueWithUniqueIdAndUnsubscribeFunction<V>(map: Map<number, V>, value: V): TUnsubscribeFunction {
  const uniqueId = Date.now() + Math.random() * 10;

  map.set(uniqueId, value);

  return () => {
    map.delete(uniqueId);
    return Promise.resolve(true);
  };
}
