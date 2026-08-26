import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Globe, Layers, MapPin, SquareMousePointer, Users } from 'lucide-react';
import { PrecinctAvatar, UserAvatar } from './Avatars';
import { PrecinctLabel } from './PrecinctLabel';
import { CaseStudyCard } from './CaseStudyCard';
import { PolisVote } from './PolisVote';
import { ConsensusView } from './ConsensusView';
import { BRAND_DOMAIN, BRAND_NAME } from '../lib/brand';
import {
  CHAPTER_BY_ID,
  DEMO_KINDS,
  SECTORS,
  chaptersForKind,
  type Chapter,
  type ChapterId,
  type DemoKind,
} from '../lib/chapters';
import { SouthAfricaMap } from './SouthAfricaMap';
import type { Vote, VoteValue } from '../types';

export type { DemoKind };

type Leaf = 'brief' | 'instrument' | 'deliberate' | 'record';

const LEAVES: { id: Leaf; label: string }[] = [
  { id: 'brief', label: 'Brief' },
  { id: 'instrument', label: 'Instrument' },
  { id: 'deliberate', label: 'Deliberate' },
  { id: 'record', label: 'Record' },
];

const QUESTION_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: 'Choice',
  SCALE: 'Scale',
  SHORT_TEXT: 'Short text',
  LONG_TEXT: 'Open',
  YES_NO: 'Yes / No',
  MATRIX: 'Matrix',
  AB_TEST: 'A/B',
};

interface ChaptersDemoProps {
  kind: DemoKind;
  chapterId: ChapterId | null;
  guestId: string;
  onOpen: (id: ChapterId | null) => void;
  onOpenKind: (kind: DemoKind) => void;
  onHome: () => void;
}

export const ChaptersDemo: React.FC<ChaptersDemoProps> = ({
  kind,
  chapterId,
  guestId,
  onOpen,
  onOpenKind,
  onHome,
}) => {
  const chapter = chapterId ? CHAPTER_BY_ID[chapterId] : null;
  const isGov = kind === 'government';
  const [startLeaf, setStartLeaf] = useState<Leaf>('brief');

  const openFile = (id: ChapterId, leaf?: Leaf) => {
    setStartLeaf(leaf || 'brief');
    onOpen(id);
  };

  return (
    <div className="min-h-screen font-sans text-ink-800 bg-cream">
      <header className="sticky top-0 z-50 bg-ember-500 text-white pt-[env(safe-area-inset-top)]">
        <nav className="flex items-center justify-between gap-3 px-4 sm:px-12 h-12 sm:h-14 border-b border-white/15">
          <button
            type="button"
            onClick={onHome}
            className="flex items-center gap-2 min-w-0 text-left active:scale-[0.97] transition-transform duration-150"
          >
            <PrecinctAvatar size="sm" />
            <span className="leading-tight min-w-0">
              <span className="block font-serif text-base sm:text-lg font-semibold tracking-tight truncate">
                {BRAND_NAME}
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-white/65">
                {BRAND_DOMAIN}
              </span>
            </span>
          </button>
        </nav>
        <div className="grid grid-cols-3 border-b border-white/15" role="tablist" aria-label="Sectors">
          {DEMO_KINDS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={kind === item}
              onClick={() => onOpenKind(item)}
              className={`min-h-11 px-1 text-[11px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.16em] active:scale-[0.98] transition-[transform,color,background-color] duration-150 ${
                kind === item ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <span className="sm:hidden">{SECTORS[item].navShort}</span>
              <span className="hidden sm:inline">{SECTORS[item].nav}</span>
            </button>
          ))}
        </div>
      </header>

      {chapter ? (
        <ChapterFile
          key={`${chapter.id}-${startLeaf}`}
          chapter={chapter}
          guestId={guestId}
          isGov={isGov}
          kind={kind}
          initialLeaf={startLeaf}
          onBack={() => onOpen(null)}
        />
      ) : (
        <SectorIndex kind={kind} onOpen={openFile} onOpenKind={onOpenKind} />
      )}
    </div>
  );
};

function SectorIndex({
  kind,
  onOpen,
  onOpenKind,
}: {
  kind: DemoKind;
  onOpen: (id: ChapterId, leaf?: Leaf) => void;
  onOpenKind: (kind: DemoKind) => void;
}) {
  const sector = SECTORS[kind];
  const files = chaptersForKind(kind);
  const others = DEMO_KINDS.filter((item) => item !== kind);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-12 py-10 sm:py-16">
      <p className="text-[11px] uppercase tracking-[0.28em] text-ink-400 mb-3">{sector.eyebrow}</p>
      <h1 className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-ink-950 leading-[1.12]">
        {sector.title}
      </h1>
      {kind === 'government' ? (
        <p className="mt-4 max-w-2xl text-ink-800/70 leading-relaxed">
          Prepared for departmental partners in South Africa. Public Works opens with
          KwaZulu-Natal for the Department of Public Works and Infrastructure —{' '}
          <a
            href="http://publicworks.gov.za/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-ink-950"
          >
            publicworks.gov.za
            <ArrowUpRight size={12} className="inline ml-0.5 align-text-bottom" />
          </a>
          . Local benefit opens in eMalahleni — who is hired, who is paid, and
          what lasts after the fence. The map is the country: every province has
          voices on public works, service delivery, and water. Filter by topic. A
          marked province opens the full pilot — not an official publication.
        </p>
      ) : (
        <p className="mt-4 max-w-2xl text-ink-800/70 leading-relaxed">{sector.summary}</p>
      )}

      {kind === 'government' && (
        <SouthAfricaMap
          region="za"
          className="mt-10"
          onOpenChapter={(id, leaf) => onOpen(id, leaf)}
        />
      )}

      <ul className={`space-y-3 max-w-xl ${kind === 'government' ? 'mt-8' : 'mt-10'}`}>
        {files.map((ch) => (
          <li key={ch.id}>
            <CaseStudyCard chapter={ch} onOpen={() => onOpen(ch.id)} />
          </li>
        ))}
      </ul>

      {kind === 'technology' && (
        <p className="mt-8 max-w-2xl text-sm text-ink-500 leading-relaxed">
          Product and conference instruments live in Create. This page is the civic record of how
          people meet the tool — not a vendor benchmark.
        </p>
      )}

      <p className="mt-10 max-w-2xl text-xs text-ink-400 leading-relaxed">
        {others.map((item, i) => (
          <span key={item}>
            {i > 0 ? ' · ' : null}
            <button
              type="button"
              onClick={() => onOpenKind(item)}
              className="underline underline-offset-2 hover:text-ink-700 active:scale-[0.97] transition-[transform,color] duration-150"
            >
              {SECTORS[item].title}
            </button>
          </span>
        ))}
      </p>
    </main>
  );
}

function ChapterFile({
  chapter,
  guestId,
  isGov,
  kind,
  initialLeaf,
  onBack,
}: {
  chapter: Chapter;
  guestId: string;
  isGov: boolean;
  kind: DemoKind;
  initialLeaf: Leaf;
  onBack: () => void;
}) {
  const [leaf, setLeaf] = useState<Leaf>(initialLeaf);
  const mapRegion = chapter.id === 'natal' || chapter.id === 'emalahleni' ? chapter.id : null;
  const [extraVotes, setExtraVotes] = useState<Vote[]>([]);
  const [extraUtterances, setExtraUtterances] = useState(chapter.utterances);

  const votes = useMemo(() => [...chapter.votes, ...extraVotes], [chapter.votes, extraVotes]);

  const handleVote = async (utteranceId: string, value: VoteValue, reason?: string) => {
    setExtraVotes((prev) => {
      const rest = prev.filter((v) => !(v.voterId === guestId && v.utteranceId === utteranceId));
      return [
        ...rest,
        {
          id: `${guestId}-${utteranceId}`,
          utteranceId,
          surveyId: chapter.survey.id,
          voterId: guestId,
          value,
          reason,
          createdAt: Date.now(),
        },
      ];
    });
  };

  const handleUtterance = async (text: string) => {
    const row = {
      id: `${chapter.survey.id}-guest-${Date.now()}`,
      surveyId: chapter.survey.id,
      text,
      source: 'participant' as const,
      authorId: guestId,
      createdAt: Date.now(),
    };
    setExtraUtterances((prev) => [...prev, row]);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-12 py-6 sm:py-12 pb-20">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-950 active:scale-[0.97] transition-transform duration-150 mb-8"
      >
        <ArrowLeft size={14} />
        {SECTORS[kind].title}
      </button>

      <div className="bg-white border border-ink-200 rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-8 py-6 sm:py-8 border-b border-ink-100">
          <h1>
            <PrecinctLabel city={chapter.city} topic={chapter.topic} size="page" />
          </h1>
          <p className="mt-3 text-ink-800/70">{chapter.theme}</p>
          <p className="mt-2 text-sm text-ink-500">
            {chapter.country}
            {chapter.region !== chapter.city && chapter.region !== chapter.country
              ? ` · ${chapter.region}`
              : null}
            {' · '}
            {chapter.partnerUrl ? (
              <a
                href={chapter.partnerUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-ink-800"
              >
                {chapter.partner}
              </a>
            ) : (
              chapter.partner
            )}
          </p>
          <p className="mt-3 text-[11px] tabular-nums tracking-[0.08em] text-ink-400">
            {chapter.fileNo}
          </p>
        </div>

        {isGov && mapRegion && leaf !== 'record' && (
          <div className="px-5 sm:px-8 py-5 border-b border-ink-100 bg-cream/40">
            <SouthAfricaMap
              region={mapRegion}
              onOpenChapter={(_id, nextLeaf) => {
                if (nextLeaf) setLeaf(nextLeaf);
              }}
            />
          </div>
        )}

        <nav
          className="flex gap-2 overflow-x-auto px-4 sm:px-8 py-3 border-b border-ink-100 bg-cream/60 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="File sections"
        >
          {LEAVES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLeaf(item.id)}
              className={`shrink-0 min-h-10 px-3.5 py-1.5 text-sm font-medium rounded-full active:scale-[0.97] transition-[transform,color,background-color] duration-150 ${
                leaf === item.id
                  ? 'bg-ink-950 text-white'
                  : 'text-ink-600 hover:bg-white border border-ink-200'
              }`}
            >
              <span className="text-[10px] tabular-nums opacity-60 mr-1.5">{i + 1}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className={leaf === 'record' ? 'px-4 sm:px-6 py-2' : 'px-5 sm:px-8 py-8'}>
          {leaf === 'brief' && <BriefLeaf chapter={chapter} />}
          {leaf === 'instrument' && <InstrumentLeaf chapter={chapter} />}
          {leaf === 'deliberate' && (
            <PolisVote
              surveyTitle={chapter.title}
              utterances={extraUtterances}
              votes={votes}
              voterId={guestId}
              onVote={handleVote}
              onSubmitUtterance={handleUtterance}
              onViewConsensus={() => setLeaf('record')}
            />
          )}
          {leaf === 'record' && (
            <ConsensusView
              surveyTitle={chapter.title}
              utterances={extraUtterances}
              votes={votes}
              initialEssay={chapter.essay}
              locked
              mapRegion={isGov ? mapRegion || 'za' : undefined}
              onOpenMapStage={(_id, nextLeaf) => {
                if (nextLeaf) setLeaf(nextLeaf);
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function BriefLeaf({ chapter }: { chapter: Chapter }) {
  const { context } = chapter;
  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-[11px] uppercase tracking-[0.22em] text-ink-400 mb-4 text-center">The prompt</p>
      <div className="w-full relative bg-white p-2 rounded-3xl border-2 border-ink-200">
        <div className="flex items-start gap-3 px-5 sm:px-6 pt-5">
          <SquareMousePointer className="w-5 h-5 text-ink-300 mt-2 shrink-0" strokeWidth={1.75} />
          <p className="w-full pb-6 text-xl sm:text-2xl font-serif text-ink-900 leading-snug">
            {chapter.prompt}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 pt-4 px-4 pb-2">
          <span className="inline-flex items-center gap-2 bg-ink-50 px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700">
            <Layers className="w-4 h-4 text-ink-400" />
            {context.domain}
          </span>
          <span className="inline-flex items-center gap-2 bg-ink-50 px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700">
            <Users className="w-4 h-4 text-ink-400" />
            {context.audience}
          </span>
          <span className="inline-flex items-center gap-2 bg-ink-50 px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700">
            <MapPin className="w-4 h-4 text-ink-400" />
            {context.region}
          </span>
          <span className="inline-flex items-center gap-2 bg-ink-50 px-3 py-2 rounded-lg border border-ink-200 text-sm font-medium text-ink-700">
            <Globe className="w-4 h-4 text-ink-400" />
            {context.tone}
          </span>
          <span className="ml-auto px-5 py-2.5 rounded-xl bg-ink-950 text-white text-sm font-medium">
            Composed
          </span>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-ink-400">
        Same field as Create. Instrument is the questions the model returned, and the interviews that
        followed.
      </p>
    </div>
  );
}

function answersFor(chapter: Chapter, questionId: string) {
  return chapter.interviews.flatMap((iv) =>
    iv.messages
      .filter((m) => m.role === 'user' && m.questionId === questionId)
      .map((m) => ({ name: iv.name, place: iv.place, picture: iv.picture, text: m.text }))
  );
}

function InstrumentLeaf({ chapter }: { chapter: Chapter }) {
  return (
    <div className="space-y-14">
      <section>
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink-400 mb-2">Composed instrument</p>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink-950 tracking-tight">
          {chapter.survey.title}
        </h2>
        <p className="mt-2 text-sm text-ink-600 max-w-2xl leading-relaxed">{chapter.survey.description}</p>

        <ol className="mt-8 space-y-4">
          {chapter.survey.questions.map((question, i) => {
            const replies = answersFor(chapter, question.id);
            return (
              <li
                key={question.id}
                className="bg-cream rounded-xl border border-ink-100 overflow-hidden"
              >
                <div className="grid sm:grid-cols-[3.5rem_1fr]">
                  <span className="px-3 py-4 text-xs font-medium text-ink-400 bg-ink-50 flex items-start justify-center">
                    Q{i}
                  </span>
                  <div className="px-4 sm:px-5 py-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-ink-400 mb-1">
                      {QUESTION_LABEL[question.type] || question.type}
                    </p>
                    <p className="font-serif text-lg text-ink-950 leading-snug">{question.text}</p>
                    {question.options && (
                      <p className="mt-2 text-sm text-ink-600">{question.options.join(' · ')}</p>
                    )}
                    {question.rows && (
                      <p className="mt-1 text-sm text-ink-500">Rows: {question.rows.join(' · ')}</p>
                    )}
                    {question.minLabel && (
                      <p className="mt-2 text-xs text-ink-400">
                        {question.minLabel} — {question.maxLabel}
                      </p>
                    )}
                  </div>
                </div>
                {replies.length > 0 && (
                  <ul className="border-t border-ink-100 bg-white px-4 sm:px-5 py-3 space-y-2">
                    {replies.map((r) => (
                      <li key={`${question.id}-${r.name}`} className="flex items-start gap-2.5">
                        <UserAvatar name={r.name} picture={r.picture} size="sm" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-ink-400">
                            {r.name} · {r.place}
                          </p>
                          <p className="text-sm text-ink-800 leading-snug">{r.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink-400 mb-2">Model interviews</p>
        <h2 className="font-serif text-2xl font-semibold text-ink-950 tracking-tight">
          What the interviewer asked, and what came back
        </h2>
        <p className="mt-2 text-sm text-ink-600 max-w-2xl leading-relaxed">
          Seeded conversations — the model’s turns and the replies, as they would appear in the
          interview.
        </p>
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          {chapter.interviews.map((iv) => (
            <article
              key={iv.name}
              className="bg-ink-50 rounded-2xl border border-ink-200 overflow-hidden flex flex-col"
            >
              <header className="px-4 py-3 bg-white border-b border-ink-200 flex items-center gap-2.5">
                <UserAvatar name={iv.name} picture={iv.picture} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{iv.name}</p>
                  <p className="text-[11px] text-ink-400">{iv.place} · complete</p>
                </div>
              </header>
              <div className="px-3 py-4 space-y-3 flex-1">
                {iv.messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={`${iv.name}-${idx}`}
                      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
                    >
                      {isUser ? (
                        <UserAvatar name={iv.name} picture={iv.picture} size="sm" />
                      ) : (
                        <PrecinctAvatar size="sm" />
                      )}
                      <div
                        className={`rounded-2xl px-3 py-2 text-[13px] leading-relaxed max-w-[85%] ${
                          isUser
                            ? 'bg-ink-950 text-white rounded-br-sm'
                            : 'bg-white text-ink-800 rounded-bl-sm border border-ink-200'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
