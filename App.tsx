import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ViewMode, Survey, AIModelType, Message, Utterance, Vote, VoteValue, ParticipantIntake } from './types';
import { Builder } from './components/Builder';
import { Interviewer } from './components/Interviewer';
import { PolisVote } from './components/PolisVote';
import { ConsensusView } from './components/ConsensusView';
import { Landing } from './components/Landing';
import { ChaptersDemo } from './components/ChaptersDemo';
import { ParticipantHome } from './components/ParticipantHome';
import { FileText, Share2, BarChart3, Copy, Check, ExternalLink, Scale, Sparkles, Layers, Plus, Menu, X } from 'lucide-react';
import { db, id, tx, getSessionId } from './services/db';
import { extractUtterancesFromTranscripts } from './services/geminiService';
import { ModelPicker } from './components/ModelPicker';
import { PrecinctAvatar, UserAvatar } from './components/Avatars';
import { BRAND_DOMAIN, BRAND_NAME, brandSession, brandStorage } from './lib/brand';
import {
  belongsToKind,
  demoKindForChapter,
  isChapterId,
  parseDemoParam,
  parsePathKind,
  type ChapterId,
  type DemoKind,
} from './lib/chapters';
import { applyPageMeta, seoForView } from './lib/seo';
import { DEFAULT_AI_MODEL } from './models';
import {
  captureGoogleCredential,
  clearGoogleProfile,
  loadGoogleProfile,
  profileFromUser,
  type AuthProfile,
} from './lib/authProfile';
import { clearUserMode, getUserMode, setUserMode, type UserMode } from './lib/userMode';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const LAST_SURVEY_SUFFIX = 'last_survey_id';

type DbSurveyRow = {
  id: string;
  title: string;
  description: string;
  questions: string;
  createdAt?: number;
  creatorId?: string;
  isPublic?: boolean;
};

const parseDbSurvey = (s: DbSurveyRow): Survey => ({
  id: s.id,
  title: s.title,
  description: s.description,
  questions: JSON.parse(s.questions),
});

export default function App() {
  const { isLoading: authLoading, user, error: authError } = db.useAuth();
  const [view, setView] = useState<ViewMode>('LANDING');
  const [chapterId, setChapterId] = useState<ChapterId | null>(null);
  const [demoKind, setDemoKind] = useState<DemoKind>('government');
  const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null);
  const [currentSurveyDbId, setCurrentSurveyDbId] = useState<string | null>(null);
  const [model, setModel] = useState<AIModelType>(DEFAULT_AI_MODEL);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [voteUrl, setVoteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedVote, setCopiedVote] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [listPublicly, setListPublicly] = useState(false);
  /** Bump to remount Builder on “New interview” */
  const [builderNonce, setBuilderNonce] = useState(0);
  const [studioMenuOpen, setStudioMenuOpen] = useState(false);
  const [nonce] = useState(crypto.randomUUID());
  /** Google name / avatar from ID token (Instant user only has email) */
  const [googleProfile, setGoogleProfile] = useState<AuthProfile | null>(() => loadGoogleProfile());

  const guestSessionId = useMemo(() => getSessionId(), []);
  const sessionId = useMemo(() => user?.id || guestSessionId, [user, guestSessionId]);
  const authProfile = useMemo(() => {
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

  const applyLocation = () => {
    const params = new URLSearchParams(window.location.search);
    const respondId = params.get('respond');
    const voteId = params.get('vote');
    const chapter = params.get('chapter');
    const demo = params.get('demo');
    if (voteId) {
      setCurrentSurveyDbId(voteId);
      setView('VOTE');
      setVoteUrl(`${window.location.origin}${window.location.pathname}?vote=${voteId}`);
      return;
    }
    if (respondId) {
      setCurrentSurveyDbId(respondId);
      setView('RESPOND');
      return;
    }
    if (isChapterId(chapter)) {
      setChapterId(chapter);
      setDemoKind(demoKindForChapter(chapter));
      setView('CHAPTERS');
      return;
    }
    const kind = parseDemoParam(demo) ?? parsePathKind(window.location.pathname);
    if (kind) {
      setChapterId(null);
      setDemoKind(kind);
      setView('CHAPTERS');
      return;
    }
    setChapterId(null);
    setView('LANDING');
  };

  // --- URL Routing: /government | ?respond= | ?vote= | ?chapter= | ?demo= ---
  useEffect(() => {
    applyLocation();
    window.addEventListener('popstate', applyLocation);
    return () => window.removeEventListener('popstate', applyLocation);
  }, []);

  useEffect(() => {
    applyPageMeta(
      seoForView({
        view,
        demoKind,
        chapterId,
        surveyTitle: currentSurvey?.title,
        pathname: window.location.pathname,
        search: window.location.search,
      })
    );
  }, [view, demoKind, chapterId, currentSurvey?.title]);

  const openDemo = (kind: DemoKind, id: ChapterId | null = null) => {
    const url = new URL(window.location.href);
    url.pathname = `/${kind}`;
    url.search = '';
    if (id) url.searchParams.set('chapter', id);
    window.history.pushState({}, '', url);
    setDemoKind(kind);
    setChapterId(id);
    setView('CHAPTERS');
  };

  const openChapters = (id: ChapterId | null) => {
    openDemo(id ? demoKindForChapter(id) : demoKind, id);
  };

  const closeChapters = () => {
    const url = new URL(window.location.href);
    url.pathname = '/';
    url.search = '';
    window.history.pushState({}, '', url.pathname + url.hash);
    setChapterId(null);
    setView('LANDING');
  };

  // After participate sign-in, open the survey they clicked (skip builder)
  useEffect(() => {
    if (!user) return;
    try {
      const pendingTake = brandSession.get('pending_take');
      if (!pendingTake) return;
      brandSession.remove('pending_take');
      setUserMode('participant');
      window.location.href = `${window.location.origin}${window.location.pathname}?respond=${pendingTake}`;
    } catch { /* ignore */ }
  }, [user]);

  // One-shot resume after auth (don’t bounce people away from marketing LANDING later)
  const didResumeMode = useRef(false);
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      didResumeMode.current = false;
      return;
    }
    if (didResumeMode.current) return;
    if (view === 'RESPOND' || view === 'VOTE' || view === 'CHAPTERS') {
      didResumeMode.current = true;
      return;
    }
    didResumeMode.current = true;
    const mode = getUserMode();
    if (mode === 'participant') setView('PARTICIPANT');
    else if (mode === 'maker') setView('DASHBOARD');
  }, [authLoading, user, view]);

  const continueAs = (mode: UserMode) => {
    setUserMode(mode);
    didResumeMode.current = true;
    if (mode === 'participant') {
      setView('PARTICIPANT');
      return;
    }
    setView('DASHBOARD');
  };

  useEffect(() => {
    if (user && currentSurveyDbId) {
      brandStorage.set(LAST_SURVEY_SUFFIX, currentSurveyDbId);
    }
  }, [currentSurveyDbId, user]);

  // --- Load survey from InstantDB whenever we have a selected id ---
  const { data: surveyData } = db.useQuery(
    currentSurveyDbId
      ? { surveys: { $: { where: { id: currentSurveyDbId } } } }
      : null
  );

  useEffect(() => {
    if (!currentSurveyDbId || surveyData == null) return;
    const row = surveyData.surveys?.[0] as DbSurveyRow | undefined;
    if (!row) {
      // Stale localStorage id (deleted survey)
      setCurrentSurveyDbId(null);
      brandStorage.remove(LAST_SURVEY_SUFFIX);
      return;
    }
    try {
      const survey = parseDbSurvey(row);
      setCurrentSurvey(survey);
      if (view !== 'RESPOND' && view !== 'VOTE') {
        setShareUrl(`${window.location.origin}${window.location.pathname}?respond=${row.id}`);
        setVoteUrl(`${window.location.origin}${window.location.pathname}?vote=${row.id}`);
      }
    } catch (e) {
      console.error('Failed to parse survey from DB:', e);
    }
  }, [surveyData, view, currentSurveyDbId]);

  // --- Deliberation data ---
  const { data: deliberationData } = db.useQuery(
    currentSurveyDbId
      ? {
          utterances: { $: { where: { surveyId: currentSurveyDbId } } },
          votes: { $: { where: { surveyId: currentSurveyDbId } } },
        }
      : null
  );

  const utterances = (deliberationData?.utterances || []) as Utterance[];
  const votes = (deliberationData?.votes || []) as Vote[];
  const utteranceCount = utterances.length;
  const voteCount = votes.length;

  // Creator surveys — only when signed in (never expose to logged-out clients)
  const { data: mySurveys } = db.useQuery(
    user
      ? { surveys: { $: { where: { creatorId: { $in: [user.id, guestSessionId] } } } } }
      : null
  );

  const publishedSurveys = useMemo(() => {
    const rows = (mySurveys?.surveys || []) as DbSurveyRow[];
    return [...rows].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [mySurveys]);

  // Public directory — discoverable without being the creator
  const { data: publicSurveysData } = db.useQuery({
    surveys: { $: { where: { isPublic: true } } },
  });

  const publicSurveys = useMemo(() => {
    const rows = (publicSurveysData?.surveys || []) as DbSurveyRow[];
    return [...rows].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [publicSurveysData]);

  // Responses — creators only
  const { data: responsesData } = db.useQuery(
    user && currentSurveyDbId
      ? { responses: { $: { where: { surveyId: currentSurveyDbId } } } }
      : null
  );

  const responseCount = responsesData?.responses?.length || 0;

  // --- Publish survey to InstantDB ---
  const handlePublish = async (survey: Survey) => {
    if (!user) return;
    const surveyId = id();
    await db.transact(
      tx.surveys[surveyId].update({
        title: survey.title,
        description: survey.description,
        questions: JSON.stringify(survey.questions),
        model,
        createdAt: Date.now(),
        creatorId: user.id,
        isPublic: listPublicly,
      })
    );
    setCurrentSurveyDbId(surveyId);
    const url = `${window.location.origin}${window.location.pathname}?respond=${surveyId}`;
    setShareUrl(url);
  };

  const handleTogglePublic = async (surveyId: string, next: boolean) => {
    if (!user) return;
    await db.transact(tx.surveys[surveyId].update({ isPublic: next }));
  };

  // --- Save response to InstantDB ---
  const handleResponseComplete = async (transcript: Message[], intake: ParticipantIntake) => {
    if (!currentSurveyDbId) return;
    const responseId = id();
    await db.transact(
      tx.responses[responseId].update({
        surveyId: currentSurveyDbId,
        answers: JSON.stringify({}),
        transcript: JSON.stringify(transcript),
        participant: JSON.stringify(intake),
        respondentId: sessionId,
        completedAt: Date.now(),
      })
    );
  };

  const ensureVoteUrl = (surveyId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?vote=${surveyId}`;
    setVoteUrl(url);
    return url;
  };

  /** Distill interview answers into Polis-style voteable statements */
  const handleExtractUtterances = async () => {
    if (!currentSurveyDbId || !responsesData?.responses?.length) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const texts = responsesData.responses.map((r) => {
        try {
          const transcript = JSON.parse((r as unknown as { transcript: string }).transcript) as Message[];
          return transcript
            .filter((m) => m.role === 'user')
            .map((m) => m.content)
            .join('\n');
        } catch {
          return '';
        }
      }).filter(Boolean);

      const extracted = await extractUtterancesFromTranscripts(
        texts,
        currentSurvey?.title || 'Survey',
        model
      );

      if (extracted.length === 0) {
        setExtractError('No voteable statements found. Try collecting more open-text answers.');
        return;
      }

      const existingTexts = new Set(utterances.map((u) => u.text.toLowerCase().trim()));
      const txs = extracted
        .filter((t) => !existingTexts.has(t.toLowerCase().trim()))
        .map((text) => {
          const utteranceId = id();
          return tx.utterances[utteranceId].update({
            surveyId: currentSurveyDbId!,
            text,
            source: 'extracted' as const,
            authorId: sessionId,
            createdAt: Date.now(),
          });
        });

      if (txs.length > 0) {
        await db.transact([
          ...txs,
          tx.surveys[currentSurveyDbId].update({ deliberationOpen: true }),
        ]);
      }

      ensureVoteUrl(currentSurveyDbId);
    } catch (e) {
      console.error(e);
      setExtractError(e instanceof Error ? e.message : 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const handleCastVote = async (utteranceId: string, value: VoteValue, reason?: string) => {
    if (!currentSurveyDbId) return;
    const existing = votes.find(
      (v) => v.utteranceId === utteranceId && v.voterId === sessionId
    );
    const voteId = existing?.id || id();
    await db.transact(
      tx.votes[voteId].update({
        utteranceId,
        surveyId: currentSurveyDbId,
        voterId: sessionId,
        value,
        reason: reason || '',
        createdAt: existing?.createdAt || Date.now(),
      })
    );
  };

  const handleSubmitUtterance = async (text: string) => {
    if (!currentSurveyDbId) return;
    const utteranceId = id();
    await db.transact(
      tx.utterances[utteranceId].update({
        surveyId: currentSurveyDbId,
        text,
        source: 'participant' as const,
        authorId: sessionId,
        createdAt: Date.now(),
      })
    );
  };

  const handleCopyVoteLink = () => {
    if (!currentSurveyDbId) return;
    const url = voteUrl || ensureVoteUrl(currentSurveyDbId);
    navigator.clipboard.writeText(url);
    setCopiedVote(true);
    setTimeout(() => setCopiedVote(false), 2000);
  };

  const handleSurveyCreated = (survey: Survey) => {
    setCurrentSurvey(survey);
    // New AI draft is not yet published — don't keep Results tied to a previous survey
    if (survey.id !== currentSurveyDbId) {
      setCurrentSurveyDbId(null);
      setShareUrl(null);
      brandStorage.remove(LAST_SURVEY_SUFFIX);
    }
  };

  const selectPublishedSurvey = (row: DbSurveyRow) => {
    try {
      const survey = parseDbSurvey(row);
      setCurrentSurvey(survey);
      setCurrentSurveyDbId(row.id);
      setListPublicly(!!row.isPublic);
      setShareUrl(`${window.location.origin}${window.location.pathname}?respond=${row.id}`);
      setVoteUrl(`${window.location.origin}${window.location.pathname}?vote=${row.id}`);
      setView('DASHBOARD');
    } catch (e) {
      console.error(e);
    }
  };

  /** Clean slate — new compose, don’t reopen the last survey */
  const startNewSurvey = () => {
    setCurrentSurvey(null);
    setCurrentSurveyDbId(null);
    setShareUrl(null);
    setVoteUrl(null);
    setListPublicly(false);
    brandStorage.remove(LAST_SURVEY_SUFFIX);
    setBuilderNonce((n) => n + 1);
    setView('DASHBOARD');
  };

  const handlePreview = (survey: Survey) => {
    setCurrentSurvey(survey);
    setView('INTERVIEWER');
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = () => {
    db.auth.signOut();
    clearGoogleProfile();
    clearUserMode();
    setGoogleProfile(null);
    setCurrentSurvey(null);
    setCurrentSurveyDbId(null);
    setShareUrl(null);
    setView('LANDING');
    brandStorage.remove(LAST_SURVEY_SUFFIX);
  };

  const handleGoogleSuccess = ({ credential }: { credential?: string | null }) => {
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

  const openPublicSurvey = (surveyId: string) => {
    window.location.href = `${window.location.origin}${window.location.pathname}?respond=${surveyId}`;
  };

  if (view === 'CHAPTERS') {
    return (
      <ChaptersDemo
        kind={demoKind}
        chapterId={chapterId && belongsToKind(chapterId, demoKind) ? chapterId : null}
        guestId={sessionId}
        onOpen={openChapters}
        onOpenKind={(kind) => openDemo(kind, null)}
        onHome={closeChapters}
      />
    );
  }

  // --- Public Vote View (Polis deliberation / living archive) ---
  if (view === 'VOTE') {
    return (
      <div className="min-h-screen font-sans text-ink-50">
        <div className="archive-grain min-h-[42vh] relative">
          <nav className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center px-6 z-10">
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
                <Scale size={18} />
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight">{BRAND_NAME}</span>
              <span className="text-xs text-white/50 ml-2 tracking-wide">Living archive</span>
            </div>
          </nav>
          <div className="relative pt-28 px-6 pb-12 text-center max-w-2xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/50 mb-4 animate-rise-in">
              Hifadhi ya sauti · A record of voices
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-white leading-[1.15] animate-rise-in">
              {currentSurvey?.title || 'Deliberation'}
            </h1>
            <p className="mt-4 text-white/70 text-sm sm:text-base leading-relaxed animate-rise-in font-serif">
              This is not a poll. It is a shared record — vote, testify, and find where the group holds together.
            </p>
          </div>
        </div>
        <main className="archive-paper -mt-6 rounded-t-3xl px-6 lg:px-12 min-h-[58vh] pb-16 relative z-10">
          {currentSurvey ? (
            <PolisVote
              surveyTitle={currentSurvey.title}
              utterances={utterances}
              votes={votes}
              voterId={sessionId}
              onVote={handleCastVote}
              onSubmitUtterance={handleSubmitUtterance}
              onViewConsensus={() => setView('CONSENSUS')}
            />
          ) : (
            <div className="flex items-center justify-center h-[40vh]">
              <p className="text-ink-500 text-sm">Loading deliberation…</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- Public / shared consensus landscape ---
  if (view === 'CONSENSUS' && !user) {
    return (
      <div className="min-h-screen font-sans text-stone-900 bg-stone-50">
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-stone-200 z-50 flex items-center justify-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white">
              <Scale size={18} />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight">{BRAND_NAME}</span>
            <span className="text-xs text-stone-400 ml-2">Consensus map</span>
          </div>
        </nav>
        <main className="pt-24 px-6 lg:px-12 min-h-screen w-full">
          <ConsensusView
            surveyTitle={currentSurvey?.title || 'Survey'}
            utterances={utterances}
            votes={votes}
            model={model}
          />
          <div className="max-w-3xl mx-auto pb-12">
            <button
              type="button"
              onClick={() => setView('VOTE')}
              className="text-sm text-ink-500 hover:text-ink-800 underline underline-offset-2"
            >
              ← Back to voting
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- Respondent View (sign-in → consent in chat) ---
  if (view === 'RESPOND') {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="min-h-screen font-sans text-stone-900 bg-stone-50">
          <nav className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-stone-200 z-50 flex items-center justify-center px-6">
            <div className="flex items-center gap-2.5">
              <PrecinctAvatar size="sm" />
              <span className="font-serif text-lg font-semibold tracking-tight">{BRAND_NAME}</span>
            </div>
          </nav>
          <main className="pt-20 px-6 lg:px-12 min-h-screen w-full">
            {currentSurvey ? (
              <Interviewer
                model={model}
                survey={currentSurvey}
                onExit={() => {}}
                isRespondent={true}
                authProfile={authProfile}
                authNonce={nonce}
                onComplete={handleResponseComplete}
              />
            ) : (
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto bg-stone-100 rounded-full flex items-center justify-center">
                    <Layers size={24} className="text-stone-400 animate-pulse" />
                  </div>
                  <p className="text-stone-500 text-sm">Loading survey...</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </GoogleOAuthProvider>
    );
  }

  // --- Participant home (signed-in, surveys first — not the builder) ---
  if (view === 'PARTICIPANT' && user && authProfile) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ParticipantHome
          profile={authProfile}
          publicSurveys={publicSurveys}
          onTakeSurvey={openPublicSurvey}
          onCreate={() => continueAs('maker')}
          onSignOut={handleSignOut}
          onHome={() => setView('LANDING')}
        />
      </GoogleOAuthProvider>
    );
  }

  // --- Landing (guests, or explicit marketing home) ---
  if (view === 'LANDING' || !user) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Landing
          user={user ? { id: user.id, email: user.email ?? undefined } : null}
          nonce={nonce}
          model={model}
          publicSurveys={publicSurveys}
          mySurveys={user ? publishedSurveys : []}
          onContinue={continueAs}
          onSurveyCreated={(survey) => {
            setUserMode('maker');
            setCurrentSurvey(survey);
            setCurrentSurveyDbId(null);
            setShareUrl(null);
            setView('DASHBOARD');
          }}
          onTakeSurvey={(surveyId) => {
            setUserMode('participant');
            openPublicSurvey(surveyId);
          }}
          onOpenMine={(row) => {
            setUserMode('maker');
            selectPublishedSurvey(row as DbSurveyRow);
            setView('DASHBOARD');
          }}
          onSignOut={handleSignOut}
          onOpenSector={(kind, id) => openDemo(kind, id ?? null)}
        />
      </GoogleOAuthProvider>
    );
  }

  // --- Creator View (signed in) ---
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen font-sans text-ink-800 bg-ink-50 selection:bg-leaf-400/30">
        {/* Navigation — logo, links, model, avatar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-ink-50/90 backdrop-blur-md border-b border-ink-200 pt-[env(safe-area-inset-top)]">
          <div className="h-14 flex items-center justify-between px-3 sm:px-8 gap-2">
          <button
            type="button"
            className="flex items-center gap-2 min-w-0"
            onClick={() => { setView('LANDING'); setShareUrl(null); setStudioMenuOpen(false); }}
          >
            <PrecinctAvatar size="sm" />
            <span className="font-serif text-base sm:text-lg font-semibold tracking-tight text-ink-800 truncate">{BRAND_NAME}</span>
          </button>

          <div className="flex items-center gap-0.5 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => continueAs('participant')}
              className="hidden md:inline px-2 py-1 text-sm font-medium rounded-md text-ink-400 hover:text-ink-700 transition-colors"
            >
              Participate
            </button>
            <button
              type="button"
              onClick={() => openDemo('government', null)}
              className="hidden md:inline px-2 py-1 text-sm font-medium rounded-md text-ink-400 hover:text-ink-700 transition-colors"
            >
              Sectors
            </button>
            <button
              type="button"
              onClick={() => setView('DASHBOARD')}
              className={`hidden md:inline px-2 py-1 text-sm font-medium rounded-md transition-colors ${view === 'DASHBOARD' || view === 'BUILDER' ? 'text-ink-900' : 'text-ink-400 hover:text-ink-700'}`}
            >
              Builder
            </button>
            <button
              type="button"
              onClick={() => { if (currentSurvey) setView('INTERVIEWER'); }}
              disabled={!currentSurvey}
              className={`hidden md:inline px-2 py-1 text-sm font-medium rounded-md transition-colors disabled:opacity-30 ${view === 'INTERVIEWER' ? 'text-ink-900' : 'text-ink-400 hover:text-ink-700'}`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => { if (currentSurveyDbId) setView('RESULTS'); }}
              disabled={!currentSurveyDbId}
              className={`hidden md:inline px-2 py-1 text-sm font-medium rounded-md transition-colors disabled:opacity-30 ${view === 'RESULTS' ? 'text-ink-900' : 'text-ink-400 hover:text-ink-700'}`}
            >
              Results
              {responseCount > 0 && (
                <span className="ml-1 text-[10px] bg-ink-900 text-white px-1.5 py-0.5 rounded-full">
                  {responseCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentSurveyDbId) {
                  ensureVoteUrl(currentSurveyDbId);
                  setView('CONSENSUS');
                }
              }}
              disabled={!currentSurveyDbId}
              className={`hidden md:inline-flex px-2 py-1 text-sm font-medium rounded-md transition-colors disabled:opacity-30 ${view === 'CONSENSUS' ? 'text-ink-900' : 'text-ink-400 hover:text-ink-700'}`}
            >
              Consensus
            </button>

            <div className="hidden md:block ml-1">
              <ModelPicker value={model} onChange={setModel} />
            </div>

            {user && authProfile ? (
              <div className="relative group ml-1">
                <button
                  type="button"
                  className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-400"
                  aria-label="Account"
                >
                  <UserAvatar name={authProfile.name} picture={authProfile.picture} size="md" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-52 py-2 rounded-xl border border-ink-200 bg-white shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity z-50">
                  <div className="px-3 pb-2 mb-1 border-b border-ink-100">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {[authProfile.firstName, authProfile.lastName].filter(Boolean).join(' ') ||
                        authProfile.name}
                    </p>
                    <p className="text-xs text-ink-400 truncate">{authProfile.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <GoogleLogin
                nonce={nonce}
                onError={() => alert('Login failed')}
                onSuccess={handleGoogleSuccess}
              />
            )}

            <button
              type="button"
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-full text-ink-800 active:scale-[0.97] transition-transform duration-150"
              aria-expanded={studioMenuOpen}
              aria-label={studioMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setStudioMenuOpen((open) => !open)}
            >
              {studioMenuOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
            </button>
          </div>
          </div>

          {studioMenuOpen && (
            <div className="md:hidden border-t border-ink-200 bg-white px-2 py-2">
              {(
                [
                  { label: 'Participate', run: () => continueAs('participant') },
                  { label: 'Sectors', run: () => openDemo('government', null) },
                  { label: 'Builder', run: () => setView('DASHBOARD') },
                  { label: 'Preview', run: () => { if (currentSurvey) setView('INTERVIEWER'); }, disabled: !currentSurvey },
                  { label: 'Results', run: () => { if (currentSurveyDbId) setView('RESULTS'); }, disabled: !currentSurveyDbId },
                  {
                    label: 'Consensus',
                    run: () => {
                      if (currentSurveyDbId) {
                        ensureVoteUrl(currentSurveyDbId);
                        setView('CONSENSUS');
                      }
                    },
                    disabled: !currentSurveyDbId,
                  },
                ] as { label: string; run: () => void; disabled?: boolean }[]
              ).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    item.run();
                    setStudioMenuOpen(false);
                  }}
                  className="flex w-full items-center min-h-12 px-4 rounded-xl text-[15px] font-medium text-ink-800 disabled:opacity-40 hover:bg-ink-50 active:scale-[0.99] transition-[transform,background-color] duration-150"
                >
                  {item.label}
                </button>
              ))}
              <div className="px-4 py-3">
                <ModelPicker value={model} onChange={setModel} />
              </div>
            </div>
          )}
        </nav>

        {/* Main Content */}
        <main className="pt-[calc(5rem+env(safe-area-inset-top))] px-4 sm:px-6 lg:px-12 min-h-screen w-full">
          {(view === 'DASHBOARD' || view === 'BUILDER') && (
            <div className="max-w-5xl mx-auto">
              <Builder
                key={`${currentSurveyDbId ?? 'new'}-${builderNonce}`}
                model={model}
                isAuthenticated={!!user}
                onSurveyCreated={handleSurveyCreated}
                existingSurvey={currentSurvey}
                onPreview={handlePreview}
              />

              <div className="mt-10 mb-12 space-y-6">
                {/* Below composer: new slate + previous interviews */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-ink-400 mb-1">Studio</p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink-900 tracking-tight">
                      Start something new
                    </h2>
                    <p className="text-sm text-ink-500 mt-1">
                      Clear the composer, or open a previous interview below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startNewSurvey}
                    className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2.5 bg-ink-900 text-white text-sm font-medium rounded-lg hover:bg-ink-800"
                  >
                    <Plus size={16} strokeWidth={2} />
                    New interview
                  </button>
                </div>

                {publishedSurveys.length > 0 && (
                  <div className="border border-ink-200 rounded-xl bg-white p-5 space-y-3">
                    <h3 className="font-medium flex items-center gap-2 text-sm text-ink-800">
                      <FileText size={14} />
                      Previous interviews
                    </h3>
                    <div className="space-y-2">
                      {publishedSurveys.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => selectPublishedSurvey(s)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
                            currentSurveyDbId === s.id
                              ? 'border-ink-900 bg-ink-50'
                              : 'border-ink-100 hover:border-ink-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium text-ink-900">{s.title}</div>
                            {s.isPublic && (
                              <span className="text-[10px] uppercase tracking-wider text-leaf-700 bg-leaf-400/15 px-1.5 py-0.5 rounded">
                                Public
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-ink-400 mt-1">
                            Created {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share Panel — only when a survey is loaded/generated */}
                {currentSurvey && (
                  <div className="border border-stone-200 rounded-xl bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium flex items-center gap-2">
                        <Share2 size={16} />
                        Share Survey
                      </h3>
                      {currentSurveyDbId && shareUrl && (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Published ✓</span>
                      )}
                    </div>

                    {!currentSurveyDbId || !shareUrl ? (
                      <div className="space-y-3">
                        <label className="flex gap-3 items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={listPublicly}
                            onChange={(e) => setListPublicly(e.target.checked)}
                            className="mt-1 rounded border-stone-300"
                          />
                          <span className="text-sm text-stone-600 leading-snug">
                            List on the public directory so anyone can discover this interview
                            (still requires sign-in to take it).
                          </span>
                        </label>
                        <button
                          onClick={() => handlePublish(currentSurvey)}
                          className="w-full py-3 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={14} />
                          Publish & Get Shareable Link
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-600 font-mono"
                          />
                          <button
                            onClick={handleCopyLink}
                            className="px-4 py-2 bg-stone-100 border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors flex items-center gap-1"
                          >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            {copied ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <label className="flex gap-3 items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              publishedSurveys.find((s) => s.id === currentSurveyDbId)?.isPublic ??
                              listPublicly
                            }
                            onChange={(e) => {
                              setListPublicly(e.target.checked);
                              if (currentSurveyDbId) {
                                void handleTogglePublic(currentSurveyDbId, e.target.checked);
                              }
                            }}
                            className="mt-1 rounded border-stone-300"
                          />
                          <span className="text-sm text-stone-600 leading-snug">
                            Listed on the public directory
                          </span>
                        </label>
                      </div>
                    )}

                    {currentSurveyDbId && shareUrl && (
                      <p className="text-xs text-stone-400">
                        Anyone with this link can take the survey after signing in. Responses appear in Results.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'INTERVIEWER' && currentSurvey && (
            <Interviewer
              model={model}
              survey={currentSurvey}
              onExit={() => setView('BUILDER')}
              authProfile={authProfile}
              authNonce={nonce}
            />
          )}

          {view === 'CONSENSUS' && currentSurveyDbId && (
            <ConsensusView
              surveyTitle={currentSurvey?.title || 'Survey'}
              utterances={utterances}
              votes={votes}
              voteUrl={voteUrl || `${window.location.origin}${window.location.pathname}?vote=${currentSurveyDbId}`}
              onCopyLink={handleCopyVoteLink}
              copied={copiedVote}
              model={model}
            />
          )}

          {view === 'RESULTS' && currentSurveyDbId && (
            <div className="max-w-3xl mx-auto py-8">
              <div className="mb-8">
                <h2 className="text-2xl font-serif font-bold">{currentSurvey?.title || 'Survey'} — Results</h2>
                <p className="text-stone-500 text-sm mt-1">{responseCount} response{responseCount !== 1 ? 's' : ''} collected</p>
              </div>

              {/* Deliberation launchpad */}
              {responseCount > 0 && (
                <div className="mb-8 border border-stone-200 bg-white rounded-xl p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium flex items-center gap-2 text-stone-900">
                        <Scale size={16} />
                        Open deliberation
                      </h3>
                      <p className="text-sm text-stone-500 mt-1">
                        Extract voteable statements from interviews, then invite the community
                        to Agree / Disagree / Pass — Polis-style consensus, not majority tally.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleExtractUtterances}
                      disabled={extracting}
                      className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Sparkles size={14} />
                      {extracting
                        ? 'Extracting…'
                        : utteranceCount > 0
                          ? 'Extract more statements'
                          : 'Extract statements'}
                    </button>
                    {utteranceCount > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={handleCopyVoteLink}
                          className="px-4 py-2 bg-stone-100 border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors flex items-center gap-1"
                        >
                          {copiedVote ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          {copiedVote ? 'Copied' : 'Copy vote link'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setView('CONSENSUS')}
                          className="px-4 py-2 border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
                        >
                          View consensus ({voteCount} votes)
                        </button>
                      </>
                    )}
                  </div>

                  {extractError && (
                    <p className="text-sm text-rose-600">{extractError}</p>
                  )}
                  {utteranceCount > 0 && (
                    <p className="text-xs text-stone-400">
                      {utteranceCount} statement{utteranceCount !== 1 ? 's' : ''} ready for voting
                      {voteUrl ? ` · ${voteUrl}` : ''}
                    </p>
                  )}
                </div>
              )}

              {responseCount === 0 ? (
                <div className="border border-dashed border-stone-300 rounded-xl p-12 text-center">
                  <BarChart3 size={32} className="mx-auto text-stone-300 mb-3" />
                  <p className="text-stone-500 text-sm">No responses yet. Share your survey link to start collecting.</p>
                  {shareUrl && (
                    <button
                      onClick={handleCopyLink}
                      className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
                    >
                      Copy Share Link
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {responsesData!.responses.map((r: any, i: number) => {
                    let transcript: any[] = [];
                    let participantLabel = 'Participant';
                    try { transcript = JSON.parse(r.transcript); } catch {}
                    try {
                      const p = r.participant ? JSON.parse(r.participant) : null;
                      if (p?.email) participantLabel = p.email;
                      else if (p?.name) participantLabel = p.name;
                    } catch {}
                    return (
                      <div key={r.id} className="border border-stone-200 rounded-xl bg-white p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-stone-700">Response #{i + 1}</span>
                            <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                              {participantLabel}
                            </span>
                          </div>
                          <span className="text-xs text-stone-400">
                            {new Date(r.completedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-200">
                          {transcript
                            .filter((m: any) => m.role === 'user')
                            .map((m: any, j: number) => (
                              <div key={j} className="text-sm bg-stone-50 rounded-lg px-3 py-2 text-stone-600 border border-stone-100">
                                {m.content}
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="py-8 text-center text-xs text-stone-400 border-t border-stone-100 mt-12 bg-white">
          <p>{BRAND_NAME} · {BRAND_DOMAIN} · 2026</p>
        </footer>
      </div>
    </GoogleOAuthProvider>
  );
}