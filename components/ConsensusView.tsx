import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DataEssay, Utterance, UtteranceStats, Vote, AIModelType } from '../types';
import {
  analyzePolis,
  hardVoteShare,
  pairTensions,
  reasonsForUtterance,
} from '../services/polisService';
import { generateDataEssay } from '../services/geminiService';
import { Button } from './ui/Button';
import { VoiceGlobe, type VoiceBubble } from './VoiceGlobe';
import { SouthAfricaMap } from './SouthAfricaMap';
import type { MapRegion } from '../lib/governmentMap';
import type { ChapterId } from '../lib/chapters';

interface ConsensusViewProps {
  surveyTitle: string;
  utterances: Utterance[];
  votes: Vote[];
  voteUrl?: string | null;
  onCopyLink?: () => void;
  copied?: boolean;
  model?: AIModelType;
  /** Seeded essay — render the report as already written */
  initialEssay?: DataEssay | null;
  /** Skip generate / refresh; the page is already filled */
  locked?: boolean;
  /** Government record — country cutout instead of the globe */
  mapRegion?: MapRegion;
  onOpenMapStage?: (
    id: Extract<ChapterId, 'natal' | 'emalahleni'>,
    leaf?: 'brief' | 'instrument' | 'deliberate' | 'record'
  ) => void;
}

const SECTIONS = [
  { id: 'essay-open', label: 'Story' },
  { id: 'essay-tensions', label: 'Tensions' },
  { id: 'essay-themes', label: 'Themes' },
  { id: 'essay-groups', label: 'Groups' },
  { id: 'essay-quotes', label: 'Quote wall' },
  { id: 'essay-methods', label: 'Methods' },
] as const;

export const ConsensusView: React.FC<ConsensusViewProps> = ({
  surveyTitle,
  utterances,
  votes,
  voteUrl,
  onCopyLink,
  copied,
  model = 'herald',
  initialEssay = null,
  locked = false,
  mapRegion,
  onOpenMapStage,
}) => {
  const analysis = useMemo(() => analyzePolis(utterances, votes), [utterances, votes]);
  const consensus = analysis.utterances.filter((u) => u.isConsensus);
  const contested = analysis.utterances.filter((u) => u.isContested);
  const pairs = useMemo(() => pairTensions(analysis, 4), [analysis]);
  const reasons = useMemo(
    () => votes.map((v) => v.reason).filter((r): r is string => Boolean(r?.trim())),
    [votes]
  );
  const ranked = useMemo(
    () =>
      [...analysis.utterances].sort((a, b) => {
        const ah = hardVoteShare(a).agreePct;
        const bh = hardVoteShare(b).agreePct;
        return bh - ah;
      }),
    [analysis.utterances]
  );

  const [essay, setEssay] = useState<DataEssay | null>(initialEssay);
  const [loadingEssay, setLoadingEssay] = useState(false);
  const autoKeyRef = useRef<string>(locked || initialEssay ? 'seeded' : '');

  const statsNote = `${analysis.voterCount} voters · ${analysis.utteranceCount} statements · ${votes.length} votes · ${reasons.length} reflections · ${analysis.groups.length} opinion groups`;

  const reportVoices = useMemo((): VoiceBubble[] => {
    const portraits = [
      '/portraits/a.jpg?v=2',
      '/portraits/b.jpg?v=2',
      '/portraits/c.jpg?v=2',
      '/portraits/d.jpg?v=2',
    ];
    const snippets = [
      ...reasons.slice(0, 3),
      ...consensus.map((u) => u.text).slice(0, 3),
      ...contested.map((u) => u.text).slice(0, 2),
    ]
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (snippets.length === 0) return [];

    return snippets.map((quote, i) => ({
      id: `voice-${i}`,
      picture: portraits[i % portraits.length],
      quote: quote.length > 90 ? `${quote.slice(0, 87)}…` : quote,
    }));
  }, [reasons, consensus, contested]);

  const loadEssay = async () => {
    if (utterances.length === 0) return;
    setLoadingEssay(true);
    try {
      const result = await generateDataEssay(
        surveyTitle,
        consensus.map((u) => u.text),
        contested.map((u) => u.text),
        reasons,
        model,
        statsNote
      );
      setEssay(result);
    } finally {
      setLoadingEssay(false);
    }
  };

  useEffect(() => {
    if (initialEssay) setEssay(initialEssay);
  }, [initialEssay]);

  // Auto-write essay once when enough signal exists (reset when corpus changes)
  useEffect(() => {
    if (locked || initialEssay) return;
    const key = `${surveyTitle}:${analysis.utteranceCount}:${votes.length}`;
    if (votes.length < 3 || utterances.length < 2) return;
    if (autoKeyRef.current === key) return;
    autoKeyRef.current = key;
    void loadEssay();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot per corpus key
  }, [surveyTitle, analysis.utteranceCount, votes.length, utterances.length, locked, initialEssay]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (analysis.utteranceCount === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink-400">Data essay</p>
        <h2 className="font-display text-3xl text-ink-950">No statements yet</h2>
        <p className="text-ink-500 text-sm">
          Extract statements from interviews, open deliberation, then return here for the report.
        </p>
        {voteUrl && onCopyLink && (
          <Button onClick={onCopyLink} size="sm">
            {copied ? 'Copied' : 'Copy vote link'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <article className={`mx-auto py-6 pb-24 ${mapRegion ? 'max-w-5xl' : 'max-w-3xl'}`}>
      {/* Hero */}
      <header className="space-y-6 mb-12">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink-400">The Precinct data essay</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink-950 leading-[1.1] tracking-tight">
          {essay?.headline || `What ${analysis.voterCount || 'people'} said about ${surveyTitle}`}
        </h1>
        <p className="text-ink-500 text-sm">
          {analysis.voterCount.toLocaleString()} voter{analysis.voterCount !== 1 ? 's' : ''} ·{' '}
          {analysis.utteranceCount} statement{analysis.utteranceCount !== 1 ? 's' : ''} ·{' '}
          {votes.length} votes
          {reasons.length > 0 ? ` · ${reasons.length} reflections` : ''}
        </p>

        {mapRegion ? (
          <SouthAfricaMap
            region={mapRegion}
            className="mt-2"
            onOpenChapter={onOpenMapStage}
          />
        ) : (
          reportVoices.length > 0 && (
            <div className="py-4 flex justify-center sm:justify-start">
              <VoiceGlobe variant="light" size="report" voices={reportVoices} />
            </div>
          )
        )}

        {/* Dot field — each dot ≈ a vote */}
        <VoterDots voteCount={votes.length} voterCount={analysis.voterCount} />

        <p className="font-serif text-lg text-ink-700 leading-relaxed max-w-2xl">
          {essay?.lede ||
            'A living report of bridging consensus and contested ground — votes, reflections, and opinion groups, written as an essay rather than a dashboard.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => scrollTo('essay-open')}
            className="text-sm font-medium text-ink-900 underline underline-offset-4 decoration-ink-300 hover:decoration-ember-500"
          >
            Jump to story
          </button>
          {!locked && (
            <Button size="sm" variant="secondary" onClick={loadEssay} disabled={loadingEssay}>
              {loadingEssay ? 'Writing essay…' : essay ? 'Refresh essay' : 'Generate essay'}
            </Button>
          )}
          {voteUrl && onCopyLink && (
            <button
              type="button"
              onClick={onCopyLink}
              className="text-sm text-ink-500 hover:text-ink-800"
            >
              {copied ? 'Link copied' : 'Copy vote link'}
            </button>
          )}
        </div>

        {/* Mini TOC */}
        <nav className="flex flex-wrap gap-2 pt-2 border-t border-ink-100">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="text-xs px-3 py-1.5 rounded-full border border-ink-200 text-ink-600 hover:border-ink-900 hover:text-ink-900 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Opening + coexistence */}
      <section id="essay-open" className="scroll-mt-24 space-y-6 mb-16">
        <QuotePair
          left={reasons[0]}
          right={reasons[1]}
          leftLabel="Reflection"
          rightLabel="Reflection"
        />
        <p className="font-serif text-[17px] text-ink-800 leading-[1.75]">
          {essay?.coexistence ||
            'Across deliberations, agreement and alarm rarely divide people into camps so much as coexist as tensions within each person.'}
        </p>
        {essay?.bridgeEssay && (
          <p className="font-serif text-[17px] text-ink-800 leading-[1.75]">{essay.bridgeEssay}</p>
        )}
      </section>

      {/* Tension pairs — Anthropic benefit/harm style */}
      <section id="essay-tensions" className="scroll-mt-24 mb-16 space-y-12">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-ink-950">Bridge and tension</h2>
          <p className="text-sm text-ink-500 italic font-serif">
            Green marks bridging consensus (shared across opinion groups). Blue marks contested
            claims (groups pull apart). Bar length is share of hard votes (Agree vs Disagree).
          </p>
        </div>

        {pairs.map((pair, i) => (
          <TensionPair
            key={i}
            bridge={pair.bridge}
            tension={pair.tension}
            votes={votes}
          />
        ))}

        {essay?.tensionEssay && (
          <p className="font-serif text-[17px] text-ink-800 leading-[1.75] pt-2">
            {essay.tensionEssay}
          </p>
        )}
      </section>

      {/* Ranked themes */}
      <section id="essay-themes" className="scroll-mt-24 mb-16 space-y-8">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-ink-950">What people are voting on</h2>
          <p className="text-sm text-ink-500">
            Ranked by agree rate among hard votes. Pass is shown separately.
          </p>
        </div>
        <ol className="space-y-8">
          {ranked.slice(0, 10).map((u, i) => {
            const share = hardVoteShare(u);
            const sampleReasons = reasonsForUtterance(votes, u.utteranceId).slice(0, 2);
            return (
              <li key={u.utteranceId} className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-ink-300 font-sans text-sm tabular-nums w-6">
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-sans font-semibold text-ink-900 text-base leading-snug">
                        {u.text}
                      </h3>
                      <span
                        className={`text-sm font-medium tabular-nums ${
                          u.isConsensus
                            ? 'text-emerald-700'
                            : u.isContested
                              ? 'text-sky-700'
                              : 'text-ink-500'
                        }`}
                      >
                        {share.agreePct}% agree
                      </span>
                    </div>
                    <p className="text-xs text-ink-400 mt-1">
                      {u.isConsensus
                        ? 'Bridging consensus'
                        : u.isContested
                          ? 'Contested'
                          : 'Gathering signal'}{' '}
                      · {u.agree} agree · {u.disagree} disagree · {u.pass} pass
                    </p>
                    <StackedBar agree={share.agreePct} disagree={share.disagreePct} />
                    {sampleReasons.map((r, ri) => (
                      <blockquote
                        key={ri}
                        className="mt-3 font-serif text-ink-700 text-[15px] leading-relaxed border-l-2 border-ink-200 pl-4"
                      >
                        “{r}”
                        <footer className="mt-1 text-[10px] uppercase tracking-wider text-ink-400 font-sans not-italic">
                          Voter reflection
                        </footer>
                      </blockquote>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Opinion groups + scatter */}
      <section id="essay-groups" className="scroll-mt-24 mb-16 space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-ink-950">How perspectives cluster</h2>
          <p className="text-sm text-ink-500 max-w-xl">
            Opinion groups are estimated from voting patterns (similar Agree/Disagree profiles).
            The chart plots each statement by agree rate (horizontal) and split score (vertical —
            higher means more evenly divided).
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {analysis.groups.map((g) => (
            <div
              key={g.id}
              className="border border-ink-200 rounded-xl px-5 py-4 flex items-center justify-between bg-white"
            >
              <span className="font-medium text-ink-800">{g.label}</span>
              <span className="text-sm text-ink-500 tabular-nums">{g.size} people</span>
            </div>
          ))}
        </div>

        <StatementScatter utterances={analysis.utterances} />

        <p className="font-serif text-[17px] text-ink-800 leading-[1.75]">
          {essay?.closing ||
            'Wealth of signal grows with participation. More diverse voters sharpen both the bridges and the productive tensions.'}
        </p>
      </section>

      {/* Quote wall */}
      <section id="essay-quotes" className="scroll-mt-24 mb-16 space-y-6">
        <div className="space-y-2">
          <h2 className="font-display text-2xl text-ink-950">Quote wall</h2>
          <p className="text-sm text-ink-500">
            Browse reflections people left with their votes — the texture behind the bars.
          </p>
        </div>
        {reasons.length === 0 ? (
          <p className="text-sm text-ink-400 border border-dashed border-ink-200 rounded-xl p-8 text-center">
            No reflections yet. When voters leave a “why,” they appear here.
          </p>
        ) : (
          <div className="columns-1 sm:columns-2 gap-4 space-y-4">
            {reasons.slice(0, 16).map((r, i) => (
              <blockquote
                key={i}
                className="break-inside-avoid border border-ink-200 bg-white rounded-xl px-5 py-4 font-serif text-ink-800 text-[15px] leading-relaxed"
              >
                “{r}”
              </blockquote>
            ))}
          </div>
        )}
      </section>

      {/* Methods */}
      <section id="essay-methods" className="scroll-mt-24 space-y-4 border-t border-ink-200 pt-10">
        <h2 className="font-display text-xl text-ink-950">Seeing the forest and the trees</h2>
        <p className="font-serif text-[16px] text-ink-700 leading-[1.75]">
          {essay?.methods ||
            'The Precinct collects conversational answers; statements are distilled for Agree / Disagree / Pass voting. Opinion groups come from clustering similar voting patterns. Consensus means similar support across groups; contested means groups disagree.'}
        </p>
        <p className="text-xs text-ink-400 leading-relaxed">
          Inspired by public data essays such as{' '}
          <a
            href="https://www.anthropic.com/features/81k-interviews"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-ink-700"
          >
            Anthropic’s 81k interviews
          </a>{' '}
          and the{' '}
          <a
            href="https://www.anthropic.com/economic-index#global-usage"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-ink-700"
          >
            Anthropic Economic Index
          </a>
          . This report updates as new votes arrive.
        </p>
      </section>
    </article>
  );
};

/* ——— Visual pieces ——— */

function VoterDots({ voteCount, voterCount }: { voteCount: number; voterCount: number }) {
  const dots = Math.min(80, Math.max(voteCount, voterCount, 1));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 max-w-md">
        {Array.from({ length: dots }).map((_, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-ink-800/80"
            style={{ opacity: 0.35 + (i % 5) * 0.12 }}
          />
        ))}
      </div>
      <p className="text-[11px] text-ink-400">
        Each dot represents a vote in this deliberation
        {voteCount > 80 ? ` (showing 80 of ${voteCount})` : ''}
      </p>
    </div>
  );
}

function StackedBar({ agree, disagree }: { agree: number; disagree: number }) {
  return (
    <div className="mt-2 h-2.5 w-full max-w-md rounded-sm overflow-hidden flex bg-ink-100">
      <div className="bg-emerald-600 transition-all duration-500" style={{ width: `${agree}%` }} />
      <div className="bg-sky-600 transition-all duration-500" style={{ width: `${disagree}%` }} />
    </div>
  );
}

function TensionPair({
  bridge,
  tension,
  votes,
}: {
  bridge?: UtteranceStats;
  tension?: UtteranceStats;
  votes: Vote[];
}) {
  return (
    <div className="space-y-5 border-b border-ink-100 pb-10 last:border-0">
      <div className="grid sm:grid-cols-2 gap-8">
        {bridge && (
          <TensionBar
            tone="bridge"
            label="Bridge"
            utterance={bridge}
            reason={reasonsForUtterance(votes, bridge.utteranceId)[0]}
          />
        )}
        {tension && (
          <TensionBar
            tone="tension"
            label="Tension"
            utterance={tension}
            reason={reasonsForUtterance(votes, tension.utteranceId)[0]}
          />
        )}
      </div>
    </div>
  );
}

function TensionBar({
  tone,
  label,
  utterance,
  reason,
}: {
  tone: 'bridge' | 'tension';
  label: string;
  utterance: UtteranceStats;
  reason?: string;
}) {
  const share = hardVoteShare(utterance);
  const pct = tone === 'bridge' ? share.agreePct : share.disagreePct;
  const barColor = tone === 'bridge' ? 'bg-emerald-600' : 'bg-sky-600';
  const textColor = tone === 'bridge' ? 'text-emerald-800' : 'text-sky-800';

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className={`font-sans font-bold text-sm uppercase tracking-wide ${textColor}`}>
          {label}
        </h3>
        <span className={`text-2xl font-sans font-semibold tabular-nums ${textColor}`}>
          {pct}%
        </span>
      </div>
      <p className="font-sans text-sm font-medium text-ink-900 leading-snug">{utterance.text}</p>
      <div className="h-3 bg-ink-100 rounded-sm overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-700`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <p className="text-[11px] text-ink-400">
        {tone === 'bridge'
          ? `${share.agreePct}% of hard votes agree · ${utterance.total} votes`
          : `${share.disagreePct}% of hard votes disagree · ${utterance.total} votes`}
      </p>
      {reason && (
        <blockquote className="font-serif text-[15px] text-ink-700 leading-relaxed pt-1">
          “{reason}”
          <footer className="mt-1 text-[10px] uppercase tracking-wider text-ink-400 font-sans">
            Voter reflection
          </footer>
        </blockquote>
      )}
    </div>
  );
}

function QuotePair({
  left,
  right,
  leftLabel,
  rightLabel,
}: {
  left?: string;
  right?: string;
  leftLabel: string;
  rightLabel: string;
}) {
  if (!left && !right) return null;
  return (
    <div className="grid sm:grid-cols-2 gap-6 py-2">
      {left && (
        <blockquote className="font-serif text-xl text-ink-900 leading-snug">
          “{left}”
          <footer className="mt-3 text-[10px] uppercase tracking-wider text-ink-400 font-sans">
            {leftLabel}
          </footer>
        </blockquote>
      )}
      {right && (
        <blockquote className="font-serif text-xl text-ink-900 leading-snug">
          “{right}”
          <footer className="mt-3 text-[10px] uppercase tracking-wider text-ink-400 font-sans">
            {rightLabel}
          </footer>
        </blockquote>
      )}
    </div>
  );
}

function StatementScatter({ utterances }: { utterances: UtteranceStats[] }) {
  if (utterances.length === 0) return null;

  return (
    <div className="relative border border-ink-200 rounded-2xl bg-white p-4 sm:p-6 h-72 sm:h-80">
      {/* Quadrant wash */}
      <div className="absolute inset-4 sm:inset-6 pointer-events-none grid grid-rows-2">
        <div className="bg-sky-50/80 rounded-t-lg" />
        <div className="bg-emerald-50/80 rounded-b-lg" />
      </div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[10px] uppercase tracking-wider text-ink-400 whitespace-nowrap">
        More divided ↑
      </div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider text-ink-400">
        ← Less agree · More agree →
      </div>
      {/* Avg lines */}
      <div className="absolute inset-4 sm:inset-6 pointer-events-none">
        <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-ink-300/80" />
        <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-ink-300/80" />
      </div>
      <div className="relative w-full h-full">
        {utterances.map((u) => {
          const share = hardVoteShare(u);
          const x = share.agreePct; // 0–100
          const y = share.splitScore; // 0–100
          const size = 10 + Math.min(u.total, 20);
          const color = u.isConsensus
            ? 'bg-emerald-500'
            : u.isContested
              ? 'bg-sky-500'
              : 'bg-ink-400';
          return (
            <div
              key={u.utteranceId}
              title={`${u.text} · ${share.agreePct}% agree · split ${share.splitScore}`}
              className={`absolute rounded-full ${color} opacity-80 hover:opacity-100 hover:scale-110 transition-transform cursor-default border border-white/60`}
              style={{
                width: size,
                height: size,
                left: `calc(${x}% - ${size / 2}px)`,
                bottom: `calc(${y}% - ${size / 2}px)`,
              }}
            />
          );
        })}
      </div>
      <div className="absolute top-3 right-3 flex flex-col gap-1 text-[10px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Bridge
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500" /> Contested
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-ink-400" /> Emerging
        </span>
      </div>
    </div>
  );
}
