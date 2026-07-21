import { OpinionGroup, PolisAnalysis, Utterance, UtteranceStats, Vote, VoteValue } from '../types';

/** Encode Polis ternary votes for the participant × statement matrix */
const encode = (value: VoteValue | undefined): number => {
  if (value === 'agree') return 1;
  if (value === 'disagree') return -1;
  return 0; // pass or missing
};

/**
 * Build voter × utterance matrix from votes.
 * Rows = voters, cols = utterances (stable order).
 */
export const buildVoteMatrix = (
  utterances: Utterance[],
  votes: Vote[]
): { voterIds: string[]; matrix: number[][] } => {
  const voterIds = [...new Set(votes.map((v) => v.voterId))].sort();
  const voteMap = new Map<string, VoteValue>();
  for (const v of votes) {
    voteMap.set(`${v.voterId}:${v.utteranceId}`, v.value);
  }

  const matrix = voterIds.map((voterId) =>
    utterances.map((u) => encode(voteMap.get(`${voterId}:${u.id}`)))
  );

  return { voterIds, matrix };
};

/** Mean-center each row (Polis-style) */
const centerRows = (matrix: number[][]): number[][] =>
  matrix.map((row) => {
    const mean = row.reduce((a, b) => a + b, 0) / (row.length || 1);
    return row.map((x) => x - mean);
  });

/** First principal component via power iteration on voter covariance */
const firstPrincipalComponent = (centered: number[][]): number[] => {
  const n = centered.length;
  if (n === 0) return [];

  let vec = Array.from({ length: n }, () => Math.random() - 0.5);
  for (let iter = 0; iter < 40; iter++) {
    // Cov ≈ X X^T applied as X (X^T v)
    const xtv = centered[0].map((_, j) =>
      centered.reduce((sum, row, i) => sum + row[j] * vec[i], 0)
    );
    const next = centered.map((row) =>
      row.reduce((sum, x, j) => sum + x * xtv[j], 0)
    );
    const norm = Math.sqrt(next.reduce((s, x) => s + x * x, 0)) || 1;
    vec = next.map((x) => x / norm);
  }
  return vec;
};

/**
 * Split voters into up to two opinion groups along PC1.
 * With few voters, fall back to a single group.
 */
export const clusterOpinionGroups = (
  voterIds: string[],
  matrix: number[][]
): OpinionGroup[] => {
  if (voterIds.length === 0) return [];

  if (voterIds.length < 4 || matrix[0]?.length < 2) {
    return [
      {
        id: 'group-a',
        label: 'Participants',
        memberIds: voterIds,
        size: voterIds.length,
      },
    ];
  }

  const centered = centerRows(matrix);
  const pc1 = firstPrincipalComponent(centered);
  const groupA: string[] = [];
  const groupB: string[] = [];

  pc1.forEach((score, i) => {
    if (score >= 0) groupA.push(voterIds[i]);
    else groupB.push(voterIds[i]);
  });

  // Degenerate split → single group
  if (groupA.length === 0 || groupB.length === 0) {
    return [
      {
        id: 'group-a',
        label: 'Participants',
        memberIds: voterIds,
        size: voterIds.length,
      },
    ];
  }

  return [
    { id: 'group-a', label: 'Group A', memberIds: groupA, size: groupA.length },
    { id: 'group-b', label: 'Group B', memberIds: groupB, size: groupB.length },
  ];
};

const groupAgreeRate = (
  utteranceId: string,
  memberIds: string[],
  votes: Vote[]
): number | null => {
  const relevant = votes.filter(
    (v) => v.utteranceId === utteranceId && memberIds.includes(v.voterId) && v.value !== 'pass'
  );
  if (relevant.length === 0) return null;
  const agrees = relevant.filter((v) => v.value === 'agree').length;
  return agrees / relevant.length;
};

/**
 * Polis-inspired analysis:
 * - Opinion groups from PC1 of the vote matrix
 * - Consensus: high support across groups (same direction)
 * - Contested: groups disagree with each other
 */
export const analyzePolis = (utterances: Utterance[], votes: Vote[]): PolisAnalysis => {
  const sorted = [...utterances].sort((a, b) => a.createdAt - b.createdAt);
  const { voterIds, matrix } = buildVoteMatrix(sorted, votes);
  const groups = clusterOpinionGroups(voterIds, matrix);

  const stats: UtteranceStats[] = sorted.map((u) => {
    const uVotes = votes.filter((v) => v.utteranceId === u.id);
    const agree = uVotes.filter((v) => v.value === 'agree').length;
    const disagree = uVotes.filter((v) => v.value === 'disagree').length;
    const pass = uVotes.filter((v) => v.value === 'pass').length;
    const hard = agree + disagree;
    const netSupport = hard > 0 ? (agree - disagree) / hard : null;

    const rates = groups
      .map((g) => groupAgreeRate(u.id, g.memberIds, votes))
      .filter((r): r is number => r !== null);

    let consensusScore = 0;
    let isConsensus = false;
    let isContested = false;

    if (rates.length >= 2) {
      const min = Math.min(...rates);
      const max = Math.max(...rates);
      // Both sides lean agree → consensus; both lean disagree → reverse consensus (still bridging)
      const bothAgree = min >= 0.6;
      const bothDisagree = max <= 0.4;
      consensusScore = bothAgree ? min : bothDisagree ? 1 - max : 0;
      isConsensus = bothAgree || bothDisagree;
      isContested = min <= 0.4 && max >= 0.6;
    } else if (hard >= 3 && netSupport !== null) {
      // Single-group fallback: strong majority counts as provisional consensus
      consensusScore = Math.abs(netSupport);
      isConsensus = Math.abs(netSupport) >= 0.5;
      isContested = Math.abs(netSupport) < 0.25 && hard >= 5;
    }

    return {
      utteranceId: u.id,
      text: u.text,
      agree,
      disagree,
      pass,
      total: uVotes.length,
      netSupport,
      consensusScore,
      isConsensus,
      isContested,
    };
  });

  // Surface strongest consensus / contested first within their bands
  stats.sort((a, b) => {
    if (a.isConsensus !== b.isConsensus) return a.isConsensus ? -1 : 1;
    if (a.isContested !== b.isContested) return a.isContested ? -1 : 1;
    return b.consensusScore - a.consensusScore;
  });

  return {
    groups,
    utterances: stats,
    voterCount: voterIds.length,
    utteranceCount: sorted.length,
  };
};

/** Next unvoted utterance for a voter (Pass still counts as voted) */
export const nextUnvotedUtterance = (
  utterances: Utterance[],
  votes: Vote[],
  voterId: string
): Utterance | null => {
  const voted = new Set(
    votes.filter((v) => v.voterId === voterId).map((v) => v.utteranceId)
  );
  const remaining = utterances
    .filter((u) => !voted.has(u.id))
    .sort((a, b) => a.createdAt - b.createdAt);
  return remaining[0] ?? null;
};

export const hardVoteShare = (u: UtteranceStats) => {
  const hard = u.agree + u.disagree;
  return {
    hard,
    agreePct: hard > 0 ? Math.round((u.agree / hard) * 100) : 0,
    disagreePct: hard > 0 ? Math.round((u.disagree / hard) * 100) : 0,
    passPct: u.total > 0 ? Math.round((u.pass / u.total) * 100) : 0,
    /** 0 = unified, 100 = evenly split */
    splitScore: hard > 0 ? Math.round((1 - Math.abs((u.agree - u.disagree) / hard)) * 100) : 0,
  };
};

/** Pair top bridges with top tensions for Anthropic-style tension charts */
export const pairTensions = (analysis: PolisAnalysis, limit = 4) => {
  const bridges = analysis.utterances.filter((u) => u.isConsensus);
  const tensions = analysis.utterances.filter((u) => u.isContested);
  const n = Math.max(bridges.length, tensions.length, 0);
  const pairs: { bridge?: UtteranceStats; tension?: UtteranceStats }[] = [];
  for (let i = 0; i < Math.min(n, limit); i++) {
    pairs.push({ bridge: bridges[i], tension: tensions[i] });
  }
  // If only one side exists, still surface as unpaired rows
  if (pairs.length === 0) {
    const fallback = analysis.utterances.slice(0, limit);
    return fallback.map((u) =>
      u.isContested ? { tension: u } : { bridge: u }
    );
  }
  return pairs;
};

export const reasonsForUtterance = (votes: Vote[], utteranceId: string): string[] =>
  votes
    .filter((v) => v.utteranceId === utteranceId && v.reason?.trim())
    .map((v) => v.reason!.trim());

