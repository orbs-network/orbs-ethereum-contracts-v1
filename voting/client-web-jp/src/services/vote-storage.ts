const key = '_ORBS_VOTING_HISTORY_';

const hasLocalStorageAccess = () => {
  return !!window.localStorage;
};

export const save = (from, addresses: string[]): boolean => {
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

export const get = (from: string): string[] => {
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
