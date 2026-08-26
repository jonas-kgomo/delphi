/** Product identity — The Precinct */
export const BRAND_NAME = 'The Precinct';
export const BRAND_SHORT = 'Precinct';
export const BRAND_DOMAIN = 'precinct.city';

/** What the name means — do not assume the reader knows “precinct”. */
export const PRECINCT_BLURB =
  'A precinct is a small territory with a shared stake — a ward, a clinic catchment, a workplace. The Precinct is that place for a conversation: elicit what a form leaves unsaid, then surface it for the people who decide.';

/** Same method, three rooms — named in the hero, not discovered on scroll. */
export const PRECINCT_ROOMS = [
  { room: 'Communities', href: '#civic' },
  { room: 'Governments', href: '#government' },
  { room: 'Organisations', href: '#create' },
] as const;

/** Lead thesis — hero */
export const PRECINCT_HERO = {
  title: 'Structured conversations for better decisions',
  body: 'The Precinct helps governments, communities, and organisations run thoughtful consultations and deliberations around important questions.',
} as const;

/** Just below the hero — how the same work is useful */
export const PRECINCT_HEARING = [
  {
    title: 'A better way to hear from people',
    body: 'The Precinct supports structured public consultation, helping participants contribute perspectives, respond to ideas, and clarify areas of agreement and disagreement.',
  },
  {
    title: 'Public participation, made more useful',
    body: 'The Precinct helps institutions run structured conversations that produce clearer input for planning, policy, and decision-making.',
  },
  {
    title: 'Better conversations around public decisions',
    body: 'The Precinct gives institutions a structured way to engage communities, explore options, and understand where perspectives converge or differ.',
  },
  {
    title: 'Structured participation for complex questions',
    body: 'The Precinct supports consultation and deliberation when decisions require more than a survey or public comment form.',
  },
] as const;

/** Four jobs of one place — not a sequence */
export const PRECINCT_FUNCTIONS = [
  {
    ward: 'Deliberate',
    title: 'A deliberative polling tool',
    body: 'Fosters informed, structured public dialogue to gauge how views hold — or move — after people hear each other.',
  },
  {
    ward: 'Survey',
    title: 'A comprehensive survey tool',
    body: 'Surfaces perspectives at scale with accessible, structured questions — still a conversation, not a vanished form.',
  },
  {
    ward: 'Elicit',
    title: 'An active elicitation tool',
    body: 'Draws out views, preferences, and ideals that usually sit below a first answer.',
  },
  {
    ward: 'Bridge',
    title: 'A civic bridge',
    body: 'Connects what people actually hold to the people who decide — a department, a programme, or a company.',
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
