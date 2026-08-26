import { brandStorage } from './brand';

/** How someone is using The Precinct this session / return visit */
export type UserMode = 'participant' | 'maker';

const KEY = 'user_mode';

export const getUserMode = (): UserMode | null => {
  const v = brandStorage.get(KEY);
  if (v === 'participant' || v === 'maker') return v;
  return null;
};

export const setUserMode = (mode: UserMode) => {
  brandStorage.set(KEY, mode);
};

export const clearUserMode = () => {
  brandStorage.remove(KEY);
};
