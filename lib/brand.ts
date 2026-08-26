/** Product identity — The Precinct */
export const BRAND_NAME = 'The Precinct';
export const BRAND_SHORT = 'Precinct';
export const BRAND_DOMAIN = 'precinct.city';

/** Four jobs of one civic place — not a sequence */
export const PRECINCT_FUNCTIONS = [
  {
    ward: 'Deliberate',
    title: 'A deliberative polling tool',
    body: 'Fosters informed, structured public dialogue to gauge nuanced opinion changes before and after deliberation.',
  },
  {
    ward: 'Survey',
    title: 'A comprehensive survey tool',
    body: 'Captures broad community perspectives at scale with intuitive, accessible feedback mechanisms.',
  },
  {
    ward: 'Elicit',
    title: 'An active elicitation tool',
    body: 'Uncovers underlying community values, priority issues, and creative solutions through targeted engagement.',
  },
  {
    ward: 'Bridge',
    title: 'A civic bridge',
    body: 'Connects diverse local voices directly to policy decision-makers, ensuring inclusive democratic participation.',
  },
] as const;

const PREFIX = 'precinct';
const LEGACY = 'delphi';

function read(store: Storage, suffix: string): string | null {
  return store.getItem(`${PREFIX}_${suffix}`) ?? store.getItem(`${LEGACY}_${suffix}`);
}

function write(store: Storage, suffix: string, value: string): void {
  store.setItem(`${PREFIX}_${suffix}`, value);
}

function remove(store: Storage, suffix: string): void {
  store.removeItem(`${PREFIX}_${suffix}`);
  store.removeItem(`${LEGACY}_${suffix}`);
}

export const brandStorage = {
  get: (suffix: string) => read(localStorage, suffix),
  set: (suffix: string, value: string) => write(localStorage, suffix, value),
  remove: (suffix: string) => remove(localStorage, suffix),
};

export const brandSession = {
  get: (suffix: string) => read(sessionStorage, suffix),
  set: (suffix: string, value: string) => write(sessionStorage, suffix, value),
  remove: (suffix: string) => remove(sessionStorage, suffix),
};
