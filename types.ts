export enum QuestionType {
  MultipleChoice = 'MULTIPLE_CHOICE',
  Scale = 'SCALE',
  ShortText = 'SHORT_TEXT',
  LongText = 'LONG_TEXT',
  YesNo = 'YES_NO',
  Matrix = 'MATRIX',
  AB_TEST = 'AB_TEST'
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For MultipleChoice (columns in Matrix)
  rows?: string[]; // For Matrix (the list of items to rate)
  minLabel?: string; // For Scale
  maxLabel?: string; // For Scale
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  questionId?: string; // To trigger UI rendering
  dynamicOptions?: string[]; // Extracted from [[QID:id|opt1|opt2]]
  isThinking?: boolean;
  /** True when interviewer is probing for a fuller answer (same question stays open) */
  isProbe?: boolean;
}

/** Identity from auth + consent captured in the interview chat */
export interface ParticipantIntake {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  picture?: string;
  consentToCollect: boolean;
  willingToParticipate: boolean;
}

export type ViewMode =
  | 'LANDING'
  | 'PARTICIPANT'
  | 'DASHBOARD'
  | 'BUILDER'
  | 'INTERVIEWER'
  | 'RESULTS'
  | 'RESPOND'
  | 'VOTE'
  | 'CONSENSUS';

/** Product model ids — mapped to providers in services/geminiService.ts */
export type AIModelType = 'herald' | 'oracle' | 'sibyl' | 'composer';

/** Polis-style ternary vote on an utterance */
export type VoteValue = 'agree' | 'disagree' | 'pass';

/** A short claim distilled from interview responses (or submitted by a voter) */
export interface Utterance {
  id: string;
  surveyId: string;
  text: string;
  source: 'extracted' | 'participant';
  authorId: string;
  createdAt: number;
}

export interface Vote {
  id: string;
  utteranceId: string;
  surveyId: string;
  voterId: string;
  value: VoteValue;
  /** Optional “why” — turns a vote into testimony, not just a tally */
  reason?: string;
  createdAt: number;
}

/** AI-written bridging story from consensus / contested landscape */
export interface BridgingNarrative {
  headline: string;
  summary: string;
  bridges: string[];
  tensions: string[];
}

/** Full data-essay structure for the consensus report (Anthropic-style) */
export interface DataEssay {
  headline: string;
  /** Opening thesis — 2–3 sentences */
  lede: string;
  /** How hope/alarm or bridge/tension coexist within people, not only between camps */
  coexistence: string;
  /** Short methods note: how votes + clusters were read */
  methods: string;
  /** Narrative paragraphs keyed to bridging themes */
  bridgeEssay: string;
  /** Narrative paragraphs keyed to contested themes */
  tensionEssay: string;
  /** Closing takeaway */
  closing: string;
  bridges: string[];
  tensions: string[];
}

export interface UtteranceStats {
  utteranceId: string;
  text: string;
  agree: number;
  disagree: number;
  pass: number;
  total: number;
  /** (agree - disagree) / (agree + disagree); null if no hard votes */
  netSupport: number | null;
  /** High when both groups agree in the same direction */
  consensusScore: number;
  /** Contested when groups pull in opposite directions */
  isConsensus: boolean;
  isContested: boolean;
}

export interface OpinionGroup {
  id: string;
  label: string;
  memberIds: string[];
  size: number;
}

export interface PolisAnalysis {
  groups: OpinionGroup[];
  utterances: UtteranceStats[];
  voterCount: number;
  utteranceCount: number;
}