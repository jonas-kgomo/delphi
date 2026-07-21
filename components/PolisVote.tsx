import React, { useMemo, useState } from 'react';
import { ThumbsUp, ThumbsDown, Minus, Plus, Sparkles, Quote } from 'lucide-react';
import { Utterance, Vote, VoteValue } from '../types';
import { nextUnvotedUtterance } from '../services/polisService';
import { Button } from './ui/Button';

interface PolisVoteProps {
  surveyTitle: string;
  utterances: Utterance[];
  votes: Vote[];
  voterId: string;
  onVote: (utteranceId: string, value: VoteValue, reason?: string) => Promise<void>;
  onSubmitUtterance: (text: string) => Promise<void>;
  onViewConsensus?: () => void;
}

export const PolisVote: React.FC<PolisVoteProps> = ({
  surveyTitle,
  utterances,
  votes,
  voterId,
  onVote,
  onSubmitUtterance,
  onViewConsensus,
}) => {
  const [busy, setBusy] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [draft, setDraft] = useState('');
  const [flash, setFlash] = useState<VoteValue | null>(null);
  const [pendingVote, setPendingVote] = useState<VoteValue | null>(null);
  const [reason, setReason] = useState('');

  const myVotes = useMemo(
    () => votes.filter((v) => v.voterId === voterId),
    [votes, voterId]
  );

  const current = useMemo(
    () => nextUnvotedUtterance(utterances, votes, voterId),
    [utterances, votes, voterId]
  );

  const progress =
    utterances.length === 0 ? 0 : Math.round((myVotes.length / utterances.length) * 100);

  const commitVote = async (value: VoteValue, why?: string) => {
    if (!current || busy) return;
    setBusy(true);
    setFlash(value);
    try {
      await onVote(current.id, value, why?.trim() || undefined);
      setPendingVote(null);
      setReason('');
    } finally {
      setTimeout(() => setFlash(null), 200);
      setBusy(false);
    }
  };

  const handleVoteClick = async (value: VoteValue) => {
    if (value === 'pass') {
      await commitVote('pass');
      return;
    }
    // Agree / disagree: invite a short reflection (skippable)
    setPendingVote(value);
  };

  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      await onSubmitUtterance(text);
      setDraft('');
      setShowCompose(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-6 space-y-8">
      <header className="space-y-3 text-center animate-rise-in">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink-400">Citizen deliberation</p>
        <h1 className="font-display text-3xl font-semibold text-ink-950 leading-tight">
          {surveyTitle}
        </h1>
        <p className="text-sm text-ink-500 leading-relaxed max-w-md mx-auto">
          Vote is only the start. Agree, disagree, or pass — then leave a short why so this becomes
          a living archive of voices, not a scoreboard.
        </p>
      </header>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-ink-400">
          <span>
            {myVotes.length} of {utterances.length} considered
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 bg-ink-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-ink-800 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {utterances.length === 0 ? (
        <div className="border border-dashed border-ink-300 rounded-xl p-10 text-center space-y-3">
          <Sparkles className="mx-auto text-ink-300" size={28} />
          <p className="text-sm text-ink-500">No statements yet. Be the first to contribute one.</p>
          <Button onClick={() => setShowCompose(true)} size="sm">
            <Plus size={14} className="mr-1" /> Contribute a statement
          </Button>
        </div>
      ) : current ? (
        <div
          className={`relative border border-ink-200 bg-white rounded-2xl p-8 min-h-[220px] flex flex-col justify-between shadow-sm transition-all duration-200 ${
            flash === 'agree'
              ? 'ring-2 ring-emerald-400/60'
              : flash === 'disagree'
                ? 'ring-2 ring-rose-400/60'
                : flash === 'pass'
                  ? 'ring-2 ring-ink-300'
                  : ''
          }`}
        >
          <Quote className="text-ink-200 mb-3" size={22} />
          <p className="font-serif text-xl leading-relaxed text-ink-800 text-center">
            “{current.text}”
          </p>

          {!pendingVote ? (
            <div className="grid grid-cols-3 gap-3 mt-10">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleVoteClick('disagree')}
                className="flex flex-col items-center gap-2 py-4 rounded-xl border border-ink-200 hover:border-rose-300 hover:bg-rose-50 transition-colors disabled:opacity-50"
              >
                <ThumbsDown size={22} className="text-rose-600" />
                <span className="text-xs font-medium text-ink-600">Disagree</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleVoteClick('pass')}
                className="flex flex-col items-center gap-2 py-4 rounded-xl border border-ink-200 hover:border-ink-400 hover:bg-ink-50 transition-colors disabled:opacity-50"
              >
                <Minus size={22} className="text-ink-500" />
                <span className="text-xs font-medium text-ink-600">Pass</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleVoteClick('agree')}
                className="flex flex-col items-center gap-2 py-4 rounded-xl border border-ink-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                <ThumbsUp size={22} className="text-emerald-600" />
                <span className="text-xs font-medium text-ink-600">Agree</span>
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-3 border-t border-ink-100 pt-5">
              <p className="text-sm text-ink-700 text-center">
                You {pendingVote === 'agree' ? 'agree' : 'disagree'}. Optionally — why?
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 280))}
                placeholder="A sentence of testimony helps others understand your stance…"
                rows={2}
                className="w-full px-3 py-2 border border-ink-200 rounded-xl text-sm text-ink-800 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ember-400/30 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setPendingVote(null)} disabled={busy}>
                  Back
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => commitVote(pendingVote)}
                  disabled={busy}
                >
                  Skip why
                </Button>
                <Button size="sm" onClick={() => commitVote(pendingVote, reason)} disabled={busy}>
                  Submit
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-ink-200 bg-white rounded-2xl p-10 text-center space-y-4">
          <h2 className="font-display text-xl font-semibold text-ink-900">
            You’ve considered every statement
          </h2>
          <p className="text-sm text-ink-500">
            Add a new claim for others, or read the bridging narrative forming from the group.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => setShowCompose(true)} variant="secondary">
              <Plus size={14} className="mr-1" /> Contribute statement
            </Button>
            {onViewConsensus && <Button onClick={onViewConsensus}>See the archive</Button>}
          </div>
        </div>
      )}

      {!showCompose && current && !pendingVote && (
        <button
          type="button"
          onClick={() => setShowCompose(true)}
          className="w-full text-center text-sm text-ink-400 hover:text-ink-700 transition-colors flex items-center justify-center gap-1"
        >
          <Plus size={14} /> Contribute your own statement
        </button>
      )}

      {showCompose && (
        <div className="border border-ink-200 bg-white rounded-xl p-5 space-y-3">
          <label className="block text-sm font-medium text-ink-700">Your statement</label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 200))}
            placeholder="A clear claim others can agree or disagree with…"
            rows={3}
            className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-ember-400/30 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-400">{draft.length}/200</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCompose(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!draft.trim() || busy}>
                Contribute
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
