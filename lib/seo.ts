import { BRAND_DOMAIN, BRAND_NAME } from './brand';
import { CHAPTER_BY_ID, SECTORS, parseDemoParam, parsePathKind, type ChapterId, type DemoKind } from './chapters';
import type { ViewMode } from '../types';

export const SITE_ORIGIN = `https://${BRAND_DOMAIN}`;

export const DEFAULT_DESCRIPTION =
  'A living archive of conversations. The Precinct turns research goals into interviews that listen — then opens deliberation so communities can find common ground.';

export type SeoPage = {
  title: string;
  description: string;
  image: string;
  path: string;
};

const OG = {
  home: '/og/home.png',
  government: '/og/government.png',
  development: '/og/development.png',
  technology: '/og/technology.png',
  interview: '/og/interview.png',
  deliberate: '/og/deliberate.png',
} as const;

const HOME: SeoPage = {
  title: `${BRAND_NAME} · ${BRAND_DOMAIN}`,
  description: DEFAULT_DESCRIPTION,
  image: OG.home,
  path: '/',
};

export function seoFromSearch(search: string): SeoPage {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (params.get('vote')) {
    return {
      title: `Deliberate · ${BRAND_NAME}`,
      description: 'Agree, disagree, or pass — a living vote on statements drawn from interviews.',
      image: OG.deliberate,
      path: `/?vote=${encodeURIComponent(params.get('vote') || '')}`,
    };
  }
  if (params.get('respond')) {
    return {
      title: `Interview · ${BRAND_NAME}`,
      description: 'A conversation, not a form. Sit with The Precinct for this interview.',
      image: OG.interview,
      path: `/?respond=${encodeURIComponent(params.get('respond') || '')}`,
    };
  }

  const chapter = params.get('chapter');
  const kind = parseDemoParam(params.get('demo')) ?? (isChapterKey(chapter) ? CHAPTER_BY_ID[chapter].audience : null);

  if (isChapterKey(chapter)) {
    const ch = CHAPTER_BY_ID[chapter];
    return {
      title: `${ch.title} · ${BRAND_NAME}`,
      description: ch.summary,
      image: OG[ch.audience],
      path: `/${ch.audience}/?chapter=${ch.id}`,
    };
  }

  if (kind) {
    const sector = SECTORS[kind];
    return {
      title: `${sector.title} · ${BRAND_NAME}`,
      description: `${sector.lead} ${sector.summary}`,
      image: OG[kind],
      path: `/${kind}/`,
    };
  }

  return HOME;
}

export function seoFromLocation(pathname: string, search: string): SeoPage {
  const fromSearch = seoFromSearch(search);
  if (fromSearch.path !== '/') return fromSearch;
  const kind = parsePathKind(pathname);
  if (!kind) return HOME;
  const sector = SECTORS[kind];
  return {
    title: `${sector.title} · ${BRAND_NAME}`,
    description: `${sector.lead} ${sector.summary}`,
    image: OG[kind],
    path: `/${kind}/`,
  };
}

function isChapterKey(value: string | null): value is ChapterId {
  return value === 'natal' || value === 'cape' || value === 'kenya';
}

export function seoForView(opts: {
  view: ViewMode;
  demoKind: DemoKind;
  chapterId: ChapterId | null;
  surveyTitle?: string | null;
  pathname: string;
  search: string;
}): SeoPage {
  const fromUrl = seoFromLocation(opts.pathname, opts.search);
  if (opts.view === 'VOTE') {
    return {
      ...fromUrl,
      title: opts.surveyTitle ? `${opts.surveyTitle} · Deliberate` : fromUrl.title,
      image: OG.deliberate,
    };
  }
  if (opts.view === 'RESPOND') {
    return {
      ...fromUrl,
      title: opts.surveyTitle ? `${opts.surveyTitle} · Interview` : fromUrl.title,
      image: OG.interview,
    };
  }
  if (opts.view === 'CONSENSUS') {
    return {
      ...fromUrl,
      title: opts.surveyTitle ? `${opts.surveyTitle} · Record` : `Record · ${BRAND_NAME}`,
      description: 'A data essay of bridging consensus and contested ground.',
      image: OG.deliberate,
    };
  }
  if (opts.view === 'CHAPTERS') {
    return fromUrl;
  }
  return HOME;
}

function ensureTag(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
  if (!el) {
    const tag = attrs.rel ? 'link' : 'meta';
    el = document.createElement(tag);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value));
}

/** Absolute image URL for crawlers. Uses the live origin so preview deploys still unfurl. */
export function absoluteImage(imagePath: string, origin = SITE_ORIGIN) {
  return `${origin.replace(/\/$/, '')}${imagePath}`;
}

export function applyPageMeta(page: SeoPage, origin = typeof window !== 'undefined' ? window.location.origin : SITE_ORIGIN) {
  const url = `${origin.replace(/\/$/, '')}${page.path === '/' ? '/' : page.path}`;
  const image = absoluteImage(page.image, origin);

  document.title = page.title;

  ensureTag('meta[name="description"]', { name: 'description', content: page.description });
  ensureTag('link[rel="canonical"]', { rel: 'canonical', href: url });

  const pairs: Array<[string, string, string]> = [
    ['property', 'og:title', page.title],
    ['property', 'og:description', page.description],
    ['property', 'og:url', url],
    ['property', 'og:image', image],
    ['property', 'og:image:alt', page.title],
    ['name', 'twitter:title', page.title],
    ['name', 'twitter:description', page.description],
    ['name', 'twitter:image', image],
  ];
  for (const [attr, key, content] of pairs) {
    ensureTag(`meta[${attr}="${key}"]`, { [attr]: key, content });
  }
}
