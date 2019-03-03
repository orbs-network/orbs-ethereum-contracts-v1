const key = '_ORBS_VOTING_HISTORY_';

const hasLocalStorageAccess = () => {
  return !!window.localStorage;
};

export const save = (addresses: string[]): boolean => {
  const from = ethereum.selectedAddress;
  if (!hasLocalStorageAccess()) {
    return false;
  }
  try {
    window.localStorage.setItem(`${key}${from}`, JSON.stringify(addresses));
    return true;
  } catch (err) {
    return false;
  }
};

export const get = (): string[] => {
  const from = ethereum.selectedAddress;
  if (!hasLocalStorageAccess) {
    return [];
  }
  try {
    const value = window.localStorage.getItem(`${key}${from}`);
    if (value) {
      return JSON.parse(value);
    } else {
      return [];
    }
  } catch (err) {
    return [];
  }
};
