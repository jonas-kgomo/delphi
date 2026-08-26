import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, MessagesSquare, SquarePen, X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { Survey, AIModelType } from '../types';
import { db } from '../services/db';
import { Builder } from './Builder';
import { PrecinctAvatar, UserAvatar } from './Avatars';
import { BRAND_DOMAIN, BRAND_NAME, PRECINCT_FUNCTIONS, brandSession } from '../lib/brand';
import { DEMO_KINDS, SECTORS, chaptersForKind, type DemoKind } from '../lib/chapters';
import {
  captureGoogleCredential,
  loadGoogleProfile,
  profileFromUser,
  type AuthProfile,
} from '../lib/authProfile';
import { setUserMode, type UserMode } from '../lib/userMode';
import { VoiceGlobe } from './VoiceGlobe';

export type LandingSurveyRow = {
  id: string;
  title: string;
  description: string;
  createdAt?: number;
  isPublic?: boolean;
};

interface LandingProps {
  user: { id: string; email?: string } | null;
  nonce: string;
  model: AIModelType;
  publicSurveys: LandingSurveyRow[];
  mySurveys: LandingSurveyRow[];
  /** Continue after choosing a path (maker → studio, participant → simple home) */
  onContinue: (mode: UserMode) => void;
  onSurveyCreated: (survey: Survey) => void;
  onTakeSurvey: (surveyId: string) => void;
  onOpenMine: (row: LandingSurveyRow) => void;
  onSignOut: () => void;
  onOpenSector: (kind: DemoKind) => void;
}

type LoginIntent = 'create' | 'participate' | 'choose' | null;

/**
 * Landing: marketing + composer. Sign-in routes makers to studio, participants to a simpler home.
 */
export const Landing: React.FC<LandingProps> = ({
  user,
  nonce,
  model,
  publicSurveys,
  mySurveys,
  onContinue,
  onSurveyCreated,
  onTakeSurvey,
  onOpenMine,
  onSignOut,
  onOpenSector,
}) => {
  const [loginIntent, setLoginIntent] = useState<LoginIntent>(null);
  const [googleProfile, setGoogleProfile] = useState<AuthProfile | null>(() => loadGoogleProfile());

  // After sign-in, route by intent
  useEffect(() => {
    if (!user || !loginIntent || loginIntent === 'choose') return;
    const mode: UserMode = loginIntent === 'create' ? 'maker' : 'participant';
    setUserMode(mode);
    setLoginIntent(null);
    onContinue(mode);
  }, [user, loginIntent, onContinue]);

  const landingProfile = useMemo(() => {
    if (!user) return null;
    const base = profileFromUser(user);
    if (
      googleProfile &&
      (!googleProfile.email || !base.email || googleProfile.email === base.email)
    ) {
      return {
        ...base,
        firstName: googleProfile.firstName || base.firstName,
        lastName: googleProfile.lastName || base.lastName,
        name: googleProfile.name || base.name,
        picture: googleProfile.picture || base.picture,
        email: base.email || googleProfile.email,
      };
    }
    return base;
  }, [user, googleProfile]);

  const signInSuccess = ({ credential }: { credential?: string | null }) => {
    if (!credential) return;
    setGoogleProfile(captureGoogleCredential(credential));
    db.auth
      .signInWithIdToken({
        clientName: 'google-button-for-web',
        idToken: credential,
        nonce,
      })
      .catch((err) => alert('Uh oh: ' + err.body?.message));
  };

  return (
    <div className="min-h-screen font-sans text-ink-800">
      {/* Login modal */}
      {loginIntent && !user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setLoginIntent(null)}
              className="absolute top-4 right-4 text-ink-400 hover:text-ink-800"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="mb-4 w-11 h-11 rounded-xl bg-ink-100 text-ink-800 flex items-center justify-center">
              {loginIntent === 'create' ? (
                <SquarePen size={20} strokeWidth={1.75} />
              ) : loginIntent === 'participate' ? (
                <MessagesSquare size={20} strokeWidth={1.75} />
              ) : (
                <PrecinctAvatar size="md" />
              )}
            </div>
            {loginIntent === 'choose' ? (
              <>
                <p className="text-[11px] uppercase tracking-[0.22em] text-ink-400 mb-2">Sign in</p>
                <h3 className="font-serif text-2xl font-semibold text-ink-900 mb-2">
                  How are you joining?
                </h3>
                <p className="text-sm text-ink-600 leading-relaxed mb-6">
                  Anyone can create interviews. Participants get a simpler home focused on joining
                  conversations.
                </p>
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => setLoginIntent('participate')}
                    className="flex items-start gap-3 text-left px-4 py-3 rounded-xl border border-ink-200 hover:border-ink-800 hover:bg-ink-50 transition-colors"
                  >
                    <MessagesSquare className="mt-0.5 shrink-0 text-ink-700" size={18} />
                    <span>
                      <span className="block font-medium text-ink-900">Participate</span>
                      <span className="block text-xs text-ink-500 mt-0.5">
                        Take interviews — skip the builder
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginIntent('create')}
                    className="flex items-start gap-3 text-left px-4 py-3 rounded-xl border border-ink-200 hover:border-ink-800 hover:bg-ink-50 transition-colors"
                  >
                    <SquarePen className="mt-0.5 shrink-0 text-ink-700" size={18} />
                    <span>
                      <span className="block font-medium text-ink-900">Create</span>
                      <span className="block text-xs text-ink-500 mt-0.5">
                        Open the studio to compose interviews
                      </span>
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-[0.22em] text-ink-400 mb-2">
                  {loginIntent === 'create' ? 'Create' : 'Participate'}
                </p>
                <h3 className="font-serif text-2xl font-semibold text-ink-900 mb-2">
                  {loginIntent === 'create' ? 'Sign in to create' : 'Sign in to participate'}
                </h3>
                <p className="text-sm text-ink-600 leading-relaxed mb-6">
                  {loginIntent === 'create'
                    ? 'After Google sign-in you’ll open the studio to compose your interview.'
                    : 'Sign in so we can address you in the chat. You’ll land on open interviews — not the builder.'}
                </p>
                <div className="flex justify-center">
                  <GoogleLogin
                    nonce={nonce}
                    onError={() => alert('Login failed')}
                    onSuccess={signInSuccess}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setLoginIntent('choose')}
                  className="mt-4 w-full text-center text-xs text-ink-400 hover:text-ink-700"
                >
                  Switch path
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ——— Hero ——— */}
      <section className="bg-ember-500 text-white">
        <nav className="flex items-center justify-between px-6 sm:px-12 h-14 border-b border-white/15">
          <div className="flex items-center gap-2.5">
            <PrecinctAvatar size="sm" />
            <div className="leading-tight">
              <span className="font-serif text-lg font-semibold tracking-tight block">{BRAND_NAME}</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-white/65 hidden sm:block">
                {BRAND_DOMAIN}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="#what-the-precinct-does"
              className="text-sm text-white/80 hover:text-white hidden md:inline"
            >
              What it does
            </a>
            <a
              href="#sectors"
              className="text-sm text-white/80 hover:text-white hidden md:inline"
            >
              Sectors
            </a>
            <a
              href="#create"
              className="text-sm text-white/80 hover:text-white hidden sm:inline-flex items-center gap-1.5"
            >
              <SquarePen size={15} strokeWidth={1.75} />
              Create
            </a>
            <a
              href="#participate"
              className="text-sm text-white/80 hover:text-white hidden sm:inline-flex items-center gap-1.5"
            >
              <MessagesSquare size={15} strokeWidth={1.75} />
              Participate
            </a>
            {user && landingProfile ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setUserMode('participant');
                    onContinue('participant');
                  }}
                  className="text-sm text-white/80 hover:text-white hidden sm:inline"
                >
                  My interviews
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserMode('maker');
                    onContinue('maker');
                  }}
                  className="text-sm font-medium bg-white text-ink-950 px-3.5 py-1.5 rounded-full hover:bg-cream"
                >
                  Studio
                </button>
                <UserAvatar name={landingProfile.name} picture={landingProfile.picture} size="md" />
              </>
            ) : (
              <button
                type="button"
                onClick={() => setLoginIntent('choose')}
                className="text-sm font-medium bg-white text-ink-950 px-4 py-1.5 rounded-full hover:bg-cream"
              >
                Sign in
              </button>
            )}
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 px-6 sm:px-12 py-16 sm:py-24 items-center max-w-6xl mx-auto">
          <div className="space-y-8">
            <div className="space-y-5">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">{BRAND_DOMAIN}</p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.35rem] font-semibold leading-[1.1] tracking-tight">
                A living archive of conversations
              </h1>
              <p className="text-white/90 text-lg sm:text-xl leading-relaxed max-w-md font-serif">
                The Precinct turns research goals into interviews that listen — then opens deliberation so
                communities can find common ground.
              </p>
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-white/75">
                {PRECINCT_FUNCTIONS.map((fn, i) => (
                  <li key={fn.ward} className="flex items-center gap-4">
                    {i > 0 && <span aria-hidden className="text-white/40">·</span>}
                    <a href="#what-the-precinct-does" className="hover:text-white">
                      {fn.ward}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    setUserMode('maker');
                    onContinue('maker');
                  } else {
                    document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-ink-950 font-medium text-sm rounded-full hover:bg-cream"
              >
                <SquarePen size={15} strokeWidth={2} />
                Create an interview
              </button>
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    setUserMode('participant');
                    onContinue('participant');
                  } else {
                    setLoginIntent('participate');
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/50 text-white font-medium text-sm rounded-full hover:bg-white/10"
              >
                <MessagesSquare size={15} strokeWidth={2} />
                Participate
              </button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end items-center min-h-[360px] sm:min-h-[400px] py-6 overflow-visible">
            <VoiceGlobe variant="dark" size="hero" />
          </div>
        </div>
      </section>

      {/* ——— Four wards of one precinct ——— */}
      <section id="what-the-precinct-does" className="bg-ink-950 text-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-12 py-16 sm:py-20">
          <div className="max-w-2xl space-y-3 mb-10 sm:mb-12">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">{BRAND_DOMAIN}</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
              Four civic tools. One precinct.
            </h2>
            <p className="text-white/70 text-base leading-relaxed">
              Conversation is the method. These are the jobs it does — listen at scale, go deeper,
              deliberate, and carry the record to the people who decide.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 border border-white/20">
            {PRECINCT_FUNCTIONS.map((fn) => (
              <article
                key={fn.ward}
                className="px-5 sm:px-7 py-7 sm:py-8 border-white/15 border-b sm:border-b-0 sm:odd:border-r sm:[&:nth-child(-n+2)]:border-b last:border-b-0"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-ember-400 mb-2">{fn.ward}</p>
                <h3 className="font-serif text-xl sm:text-[1.35rem] font-semibold leading-snug mb-3">
                  {fn.title}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">{fn.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Sectors ——— */}
      <section id="sectors" className="bg-cream px-6 sm:px-12 py-16 sm:py-20 border-b border-ink-800/5">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl space-y-3 mb-10 sm:mb-12">
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink-400">Sectors</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink-950 tracking-tight">
              Government. Development. Technology.
            </h2>
            <p className="text-ink-800/70 text-base leading-relaxed">
              Same four jobs. A different civic bridge. Each sector has its own records — not
              templates mixed into a departmental briefing.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {DEMO_KINDS.map((kind) => {
              const sector = SECTORS[kind];
              const lead = chaptersForKind(kind)[0];
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => onOpenSector(kind)}
                  className="text-left bg-white border border-ink-200 rounded-2xl px-5 py-6 hover:border-ink-800 hover:bg-ink-50 active:scale-[0.99] transition-[transform,background-color,border-color] duration-150"
                >
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-ink-400">
                    {sector.eyebrow}
                  </span>
                  <span className="block font-serif text-2xl font-semibold text-ink-950 mt-2 leading-snug">
                    {sector.title}
                  </span>
                  <span className="block mt-2 text-sm text-ink-800/70 leading-relaxed">
                    {sector.lead}
                  </span>
                  {lead && (
                    <span className="mt-4 block text-[11px] uppercase tracking-[0.16em] text-ink-500">
                      {lead.shortTitle} · {lead.region}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ——— Feature scope: essay / deliberation UI ——— */}
      <section id="features" className="bg-cream px-6 sm:px-12 py-16 sm:py-20 border-b border-ink-800/5">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink-400">What you get</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink-800 tracking-tight">
              From interview to data essay
            </h2>
            <p className="text-ink-800/65 text-base leading-relaxed max-w-md">
              After people talk and vote, The Precinct surfaces bridges and tensions — numbered themes,
              reflections, and Agree / Pass / Disagree — as a readable report, not a dashboard dump.
            </p>
            <ul className="space-y-2 text-sm text-ink-800/80 pt-2">
              <li>Conversational interviews with follow-ups</li>
              <li>Community deliberation on statements</li>
              <li>Consensus maps & quote walls</li>
            </ul>
          </div>
          <EssaySnippetStack />
        </div>
      </section>

      {/* ——— Create: full builder input ——— */}
      <section id="create" className="bg-white px-6 sm:px-12 py-14 sm:py-18">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="text-center space-y-3 mb-8">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-ink-900 text-white flex items-center justify-center shadow-sm">
              <SquarePen size={22} strokeWidth={1.75} />
            </div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink-400">Create</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink-800">
              What do you want the record to hold?
            </h2>
            <p className="text-ink-800/60 text-sm max-w-lg mx-auto">
              Set domain, audience, region, and tone — same composer as the studio.
              {!user && ' Sign in only when you hit Compose.'}
            </p>
          </div>

          <Builder
            model={model}
            embedded
            isAuthenticated={!!user}
            onAuthRequired={() => setLoginIntent('create')}
            existingSurvey={null}
            onSurveyCreated={onSurveyCreated}
            onPreview={() => {
              if (user) {
                setUserMode('maker');
                onContinue('maker');
              } else {
                setLoginIntent('create');
              }
            }}
          />
        </div>
      </section>

      {/* ——— Participate / public directory ——— */}
      <section id="participate" className="bg-forest text-white px-6 sm:px-12 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center">
                <MessagesSquare size={22} strokeWidth={1.75} />
              </div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">Participate</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold">
                Public interviews
              </h2>
              <p className="text-white/75 text-sm max-w-xl">
                These are listed when a creator checks <em>List on the public directory</em> at
                publish. Anyone can open them — you’ll sign in to start the conversation.
              </p>
            </div>
            {!user && (
              <button
                type="button"
                onClick={() => setLoginIntent('participate')}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-ink-950 text-sm font-medium rounded-full hover:bg-cream"
              >
                <MessagesSquare size={16} strokeWidth={2} />
                Sign in to participate
              </button>
            )}
          </div>

          {publicSurveys.length === 0 ? (
            <div className="border border-white/20 rounded-xl px-6 py-10 text-center space-y-3">
              <p className="text-white/70 text-sm">
                No public interviews yet. When you publish from the studio, turn on{' '}
                <strong className="text-white font-medium">List on the public directory</strong> —
                they’ll appear here for participants to find.
              </p>
              <a
                href="#create"
                className="inline-flex items-center gap-1 text-sm text-white underline underline-offset-4 decoration-white/40"
              >
                Compose one first
                <ArrowUpRight size={14} />
              </a>
            </div>
          ) : (
            <ul className="space-y-3">
              {publicSurveys.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/10 border border-white/15 rounded-xl px-5 py-4"
                >
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg font-semibold truncate">{s.title}</h3>
                    {s.description && (
                      <p className="text-sm text-white/70 line-clamp-2 mt-0.5">{s.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          setLoginIntent('participate');
                          try {
                            brandSession.set('pending_take', s.id);
                          } catch { /* ignore */ }
                          return;
                        }
                        onTakeSurvey(s.id);
                      }}
                      className="px-4 py-2 bg-white text-ink-950 text-sm font-medium rounded-full hover:bg-cream"
                    >
                      Take interview
                    </button>
                    <a
                      href={`${window.location.pathname}?vote=${s.id}`}
                      className="px-4 py-2 border border-white/40 text-sm font-medium rounded-full hover:bg-white/10"
                    >
                      Deliberate
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {user && mySurveys.length > 0 && (
            <div className="pt-8 border-t border-white/20 space-y-4">
              <h3 className="font-serif text-xl font-semibold">Your interviews</h3>
              <ul className="space-y-2">
                {mySurveys.slice(0, 8).map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onOpenMine(s)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-white/15 hover:bg-white/10 text-sm flex justify-between gap-3"
                    >
                      <span className="font-medium truncate">{s.title}</span>
                      <span className="text-white/50 shrink-0">
                        {s.isPublic ? 'Public' : 'Link only'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="bg-cream px-6 sm:px-12 py-14">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <blockquote className="font-serif text-xl sm:text-2xl text-ink-800 leading-relaxed">
            “Across conversations, hope and caution rarely divide people into camps so much as
            coexist as tensions within each person.”
          </blockquote>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="#create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-ink-950 text-white text-sm font-medium rounded-full hover:bg-ink-800"
            >
              <SquarePen size={16} strokeWidth={2} />
              Create
            </a>
            <a
              href="#participate"
              className="inline-flex items-center gap-2 px-6 py-3 border border-ink-950 text-ink-950 text-sm font-medium rounded-full hover:bg-ink-800/5"
            >
              <MessagesSquare size={16} strokeWidth={2} />
              Participate
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-ink-950 text-white/40 text-xs text-center py-8 px-6">
        {BRAND_NAME} · {BRAND_DOMAIN}
        <span className="mx-2">·</span>
        {DEMO_KINDS.map((kind, i) => (
          <span key={kind}>
            {i > 0 ? <span className="text-white/20"> · </span> : null}
            <button
              type="button"
              onClick={() => onOpenSector(kind)}
              className="hover:text-white/70 active:scale-[0.97] transition-[transform,color] duration-150"
            >
              {SECTORS[kind].nav}
            </button>
          </span>
        ))}
      </footer>
    </div>
  );
};

/** Product UI collage — tension bars, themes, vote chips */
function EssaySnippetStack() {
  return (
    <div className="w-full max-w-md ml-auto space-y-3" aria-hidden>
      <div className="bg-cream text-ink-800 rounded-xl px-4 py-3 shadow-lg border border-ink-800/5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              Bridge
            </p>
            <p className="text-xs font-medium mt-1 leading-snug">Care should be local first</p>
            <div className="mt-2 h-2 bg-ink-100 rounded-sm overflow-hidden">
              <div className="h-full bg-emerald-600 w-[72%]" />
            </div>
            <p className="text-[10px] text-emerald-800 mt-1 tabular-nums">72% agree</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">
              Tension
            </p>
            <p className="text-xs font-medium mt-1 leading-snug">Wait times are acceptable</p>
            <div className="mt-2 h-2 bg-ink-100 rounded-sm overflow-hidden">
              <div className="h-full bg-sky-600 w-[58%]" />
            </div>
            <p className="text-[10px] text-sky-800 mt-1 tabular-nums">58% disagree</p>
          </div>
        </div>
      </div>

      <div className="bg-white text-ink-800 rounded-xl px-4 py-3 shadow-lg border border-ink-800/5">
        <p className="text-[10px] uppercase tracking-widest text-ink-400 mb-2">Themes</p>
        <ol className="space-y-2">
          {[
            { n: '01', t: 'Trust in frontline workers', p: '81%' },
            { n: '02', t: 'Cost as the main barrier', p: '64%' },
            { n: '03', t: 'Digital booking helps', p: '49%' },
          ].map((row) => (
            <li key={row.n} className="flex items-baseline gap-2 text-xs">
              <span className="text-ink-300 tabular-nums w-5">{row.n}</span>
              <span className="flex-1 font-medium truncate">{row.t}</span>
              <span className="text-ink-500 tabular-nums">{row.p}</span>
            </li>
          ))}
        </ol>
        <div className="mt-2 h-1.5 bg-ink-100 rounded-sm overflow-hidden flex">
          <div className="bg-emerald-600 w-[64%]" />
          <div className="bg-sky-600 w-[36%]" />
        </div>
      </div>

      <div className="flex gap-3 items-stretch">
        <blockquote className="flex-1 bg-leaf-500 text-white rounded-xl px-4 py-3 border border-leaf-700/20 shadow-sm">
          <p className="font-serif text-sm leading-snug">
            “I agree — but only if the clinic stays open after 6.”
          </p>
          <footer className="mt-2 text-[9px] uppercase tracking-wider text-white/70">
            Voter reflection
          </footer>
        </blockquote>
        <div className="w-[88px] bg-cream rounded-xl px-2 py-3 flex flex-col justify-center gap-1.5 border border-ink-800/5">
          {(['Agree', 'Pass', 'Disagree'] as const).map((label, i) => (
            <div
              key={label}
              className={`text-[10px] text-center py-1 rounded-md font-medium ${
                i === 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-ink-600 border border-ink-200'
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
