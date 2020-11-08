export function enforceNumberInRange(value: number, minValue: number, maxValue: number): number {
  if (maxValue < minValue) {
    throw new Error(`Invalid numerical boundries of [${minValue}, ${maxValue}]`);
  }

  const bottomEnforced = Math.max(value, minValue);
  const bottomAndTopEnforced = Math.min(bottomEnforced, maxValue);
  return bottomAndTopEnforced;
}
