/** How someone is using Delphi this session / return visit */
export type UserMode = 'participant' | 'maker';

const KEY = 'delphi_user_mode';

export const getUserMode = (): UserMode | null => {
  const v = localStorage.getItem(KEY);
  if (v === 'participant' || v === 'maker') return v;
  return null;
};

export const setUserMode = (mode: UserMode) => {
  localStorage.setItem(KEY, mode);
};

export const clearUserMode = () => {
  localStorage.removeItem(KEY);
};
